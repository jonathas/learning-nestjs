import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { User } from './user.entity';
import { UsersService } from './users.service';

describe('AuthService', () => {
  let service: AuthService;
  let fakeUsersService: Partial<UsersService>;

  beforeEach(async () => {
    fakeUsersService = {
      find: () => Promise.resolve([]),
      create: (email: string, password: string) =>
        Promise.resolve({ id: 1, email, password } as User)
    };

    const module = await Test.createTestingModule({
      providers: [AuthService, { provide: UsersService, useValue: fakeUsersService }]
    }).compile();

    service = module.get(AuthService);
  });

  it('can create an instance of auth service', async () => {
    expect(service).toBeDefined();
  });

  it('creates a new user with a salted and hashed password', async () => {
    const user = await service.signup('asdf@asdf.com', 'asdf');
    expect(user.password).not.toEqual('asdf');
    const [salt, hash] = user.password.split('.');
    expect(salt).toBeDefined();
    expect(hash).toBeDefined();
  });

  it('throws an error if user signs up with email that is in use', async () => {
    fakeUsersService.find = () => Promise.resolve([{ id: 1, email: 'a', password: '1' } as User]);
    try {
      await service.signup('asdf@asdf.com', 'asdf');
    } catch (err) {
      expect(err.message).toBe('This email is already in use');
    }
  });

  it('throws if signin is called with an unused email', async () => {
    try {
      await service.signin('afwagawgaw@gawa.com', 'gasfa');
    } catch (err) {
      expect(err.message).toBe('E-mail or password incorrect');
    }
  });

  it('throws if an invalid password is provided', async () => {
    fakeUsersService.find = () => Promise.resolve([{ id: 1, email: 'a', password: '1' } as User]);
    try {
      await service.signin('asdf@asdf.com', 'gasfa');
    } catch (err) {
      expect(err.message).toBe('E-mail or password incorrect');
    }
  });

  it('returns a user if correct password is provided', async () => {
    fakeUsersService.find = () =>
      Promise.resolve([
        {
          id: 1,
          email: 'asdf@asdf.com',
          password:
            '1f3f1f78b727fa56.af7186ab0d0a8e9cf1ae2c5c179784947a2fe349d3a3e82f6422c0d7cbc2f925'
        } as User
      ]);
    const user = await service.signin('asdf@asdf.com', 'mypassword');
    expect(user).toBeDefined();
  });
});
