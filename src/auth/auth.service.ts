import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto } from './dto';
import * as argon from 'argon2';

@Injectable()
export class AuthService {
    constructor(private prisma: PrismaService) {}
    async signup(dto: AuthDto) {
        // genrate the password hash
        const hash = await argon.hash(dto.password);
        try {
            // create user in the database
            const user = await this.prisma.user.create({
                data: {
                    email: dto.email,
                    hash,
                },
            });

            const { hash: _, ...userWithoutHash } = user;
            return userWithoutHash;
        } catch (error) {
            if (error.code === 'P2002') {
                throw new ForbiddenException('Credentials taken');
            }
            throw error;
        }
    }
    async signin(dto: AuthDto) {
        // find the user by email
        const user = await this.prisma.user.findUnique({
            where: {
                email: dto.email,
            },
        });

        // if user does not exist throw exception
        if (!user) {
            throw new ForbiddenException('Credentials incorrect');
        }

        // compare password
        const pwMatches = await argon.verify(user.hash, dto.password);

        // if password incorrect throw exception
        if (!pwMatches) {
            throw new ForbiddenException('Password incorrect');
        }

        const { hash: _, ...userWithoutHash } = user;

        // if everything goes well -> send back the user
        return userWithoutHash;
    }
}
