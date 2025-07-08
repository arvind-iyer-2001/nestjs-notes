import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = this.extractApiKeyFromHeader(request);
    const validApiKey = this.configService.get<string>('API_KEY');

    if (!apiKey || !validApiKey) {
      throw new UnauthorizedException('API key is required');
    }

    if (apiKey !== validApiKey) {
      throw new UnauthorizedException('Invalid API key');
    }

    return true;
  }

  private extractApiKeyFromHeader(request: Request): string | undefined {
    // Check for API key in X-API-Key header
    const apiKeyHeader = request.headers['x-api-key'];

    if (Array.isArray(apiKeyHeader)) {
      return apiKeyHeader[0];
    }

    return apiKeyHeader;
  }
}
