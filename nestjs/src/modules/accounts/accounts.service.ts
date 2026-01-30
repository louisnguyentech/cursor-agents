import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Account, AccountDocument } from './schemas/account.schema';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import type ms from 'ms';
import { QueryAccountDto } from './dto/query-account.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AccountsService {
  constructor(
    @InjectModel(Account.name) private accountModel: Model<AccountDocument>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async create(dto: CreateAccountDto): Promise<AccountDocument> {
    const existing = await this.accountModel
      .findOne({ email: dto.email.toLowerCase(), deletedAt: null })
      .lean();
    if (existing) throw new ConflictException('Email already registered');
    const hashed = await bcrypt.hash(dto.password, 10);
    const doc = await this.accountModel.create({
      email: dto.email.toLowerCase(),
      password: hashed,
      role: dto.role ?? 'user',
      isActive: dto.isActive ?? true,
    });
    return doc;
  }

  async findAll(query: QueryAccountDto) {
    const { page = 1, limit = 10, role } = query;
    const filter: Record<string, unknown> = { deletedAt: null };
    if (role) filter.role = role;
    const [data, total] = await Promise.all([
      this.accountModel
        .find(filter)
        .select('-password -refreshToken -refreshTokenExpiresAt')
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),
      this.accountModel.countDocuments(filter),
    ]);
    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<AccountDocument | null> {
    return this.accountModel
      .findOne({ _id: id, deletedAt: null })
      .select('+password +refreshToken +refreshTokenExpiresAt')
      .exec();
  }

  async findByIdPublic(id: string): Promise<AccountDocument | null> {
    return this.accountModel
      .findOne({ _id: id, deletedAt: null })
      .select('-password -refreshToken -refreshTokenExpiresAt')
      .exec();
  }

  async findOne(id: string): Promise<AccountDocument> {
    const doc = await this.findByIdPublic(id);
    if (!doc) throw new NotFoundException('Account not found');
    return doc;
  }

  async update(id: string, dto: UpdateAccountDto): Promise<AccountDocument> {
    const doc = await this.accountModel
      .findOneAndUpdate(
        { _id: id, deletedAt: null },
        { $set: dto },
        { new: true },
      )
      .select('-password -refreshToken -refreshTokenExpiresAt')
      .exec();
    if (!doc) throw new NotFoundException('Account not found');
    return doc;
  }

  async remove(id: string): Promise<void> {
    const result = await this.accountModel
      .updateOne(
        { _id: id, deletedAt: null },
        { $set: { deletedAt: new Date() } },
      )
      .exec();
    if (result.matchedCount === 0) throw new NotFoundException('Account not found');
  }

  async signup(dto: CreateAccountDto) {
    const doc = await this.create(dto);
    return this.issueTokens(doc);
  }

  async login(email: string, password: string) {
    const doc = await this.accountModel
      .findOne({ email: email.toLowerCase(), deletedAt: null })
      .select('+password')
      .exec();
    if (!doc || !(await bcrypt.compare(password, doc.password)))
      throw new UnauthorizedException('Invalid credentials');
    if (!doc.isActive) throw new UnauthorizedException('Account disabled');
    return this.issueTokens(doc);
  }

  async refresh(refreshToken: string) {
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
    if (payload.type !== 'refresh') throw new UnauthorizedException('Invalid token type');
    const doc = await this.accountModel
      .findOne({ _id: payload.sub, deletedAt: null })
      .select('+refreshToken +refreshTokenExpiresAt')
      .exec();
    if (!doc?.refreshToken || !doc.refreshTokenExpiresAt)
      throw new UnauthorizedException('Refresh token revoked or expired');
    if (doc.refreshTokenExpiresAt < new Date())
      throw new UnauthorizedException('Refresh token expired');
    const match = await bcrypt.compare(refreshToken, doc.refreshToken);
    if (!match) throw new UnauthorizedException('Invalid refresh token');
    return this.issueTokens(doc);
  }

  private async issueTokens(doc: AccountDocument) {
    const payload: JwtPayload = {
      sub: String(doc._id),
      email: doc.email,
      type: 'access',
    };
    const access_token = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRY', '15m') as ms.StringValue,
    });
    const refreshPayload: JwtPayload = {
      sub: String(doc._id),
      email: doc.email,
      type: 'refresh',
    };
    const refreshExpiry = this.configService.get<string>('JWT_REFRESH_EXPIRY', '7d') as ms.StringValue;
    const refresh_token = this.jwtService.sign(refreshPayload, {
      expiresIn: refreshExpiry,
    });
    const refreshExpiresAt = new Date();
    refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 7);
    const hashedRefresh = await bcrypt.hash(refresh_token, 10);
    await this.accountModel
      .updateOne(
        { _id: doc._id },
        {
          $set: {
            refreshToken: hashedRefresh,
            refreshTokenExpiresAt: refreshExpiresAt,
          },
        },
      )
      .exec();
    return { access_token, refresh_token };
  }
}
