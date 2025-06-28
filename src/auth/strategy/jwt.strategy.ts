import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Prisma } from '@prisma/client';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(
        config: ConfigService,
        private prisma: PrismaService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: config.get('JWT_SECRET') || 'fallback-secret',
        });
    }

    // Validate method to process the JWT payload
    async validate(payload: { sub: number; email: string }) {
        // Find the user by the ID in the JWT payload
        const user = await this.prisma.user.findUnique({
            where: {
                id: payload.sub,
            },
        });
        if (!user) {
            return null;
        }
        // before returning user details, removing sensitive information
        const { hash: _, ...updatedUser } = user;

        return updatedUser; // Attach the payload to the request object
    }
}
