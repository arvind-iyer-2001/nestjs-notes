import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from './api-key.guard';

/**
 * Decorator to apply API key authentication to routes
 * Requires X-API-Key header with valid API key
 */
export const ApiKeyAuth = () => applyDecorators(UseGuards(ApiKeyGuard));