import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from './users.service';
import { randomBytes, scrypt as _scrypt } from 'crypto';
import { promisify } from 'util';
const scrypt = promisify(_scrypt);

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}

  async signup(email: string, password: string) {
    const users = await this.usersService.find(email);
    if (users.length) {
      throw new BadRequestException('This email is already in use');
    }

    const hashedPassword = await this.createHashedPassword(password);

    const user = await this.usersService.create(email, hashedPassword);
    return user;
  }

  async createHashedPassword(password: string) {
    // Generate a salt
    const salt = randomBytes(8).toString('hex');
    const hash = await this.hashPassword(salt, password);
    // Join the hashed result and the salt together
    return salt + '.' + hash.toString('hex');
  }

  /**
   * Hash the salt and the password together
   * @param password string
   * @param salt string
   * @returns The hashed result
   */
  async hashPassword(salt: string, password: string): Promise<Buffer> {
    const hash = (await scrypt(password, salt, 32)) as Buffer;
    return hash;
  }

  async signin(email: string, password: string) {
    const [user] = await this.usersService.find(email);
    const errorMsg = 'E-mail or password incorrect';
    if (!user) {
      throw new UnauthorizedException(errorMsg);
    }

    const [salt, storedHash] = user.password.split('.');
    const hash = await this.hashPassword(salt, password);

    if (hash.toString('hex') !== storedHash) {
      throw new UnauthorizedException(errorMsg);
    }
    return user;
  }
}
