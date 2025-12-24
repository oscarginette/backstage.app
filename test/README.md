# Test Suite

Comprehensive test suite for Backstage authentication and domain logic.

## Running Tests

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

## Test Structure

```
test/
├── setup.ts                          # Global test configuration
├── domain/
│   ├── entities/
│   │   └── User.test.ts             # User entity tests (30 tests)
│   └── services/
│       └── CreateUserUseCase.test.ts # Signup use case tests (20 tests)
└── README.md                         # This file
```

## Coverage

Current test coverage:

- **User Entity**: 30 tests
  - Factory methods (createNew, fromDatabase)
  - Password hashing and verification
  - Email validation
  - Password strength validation
  - Business logic methods (isAdmin, toPublic)
  - Getters

- **CreateUserUseCase**: 20 tests
  - Successful user creation
  - Email validation
  - Password validation
  - Password confirmation matching
  - Duplicate email handling
  - Quota tracking creation
  - Error handling

## Test Philosophy

### 1. **Clean Architecture Compliance**

Tests follow Clean Architecture principles:

- **Domain Layer**: Tests entities and use cases in isolation
- **Mocking**: Use mock repositories (not real database)
- **No External Dependencies**: Domain tests don't depend on infrastructure

### 2. **Test Structure**

Each test file follows this structure:

```typescript
describe('EntityOrUseCase', () => {
  describe('Feature Group', () => {
    it('should do specific thing', () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

### 3. **Mock Implementations**

Mock repositories implement the full interface:

```typescript
class MockUserRepository implements IUserRepository {
  private users: Map<string, User> = new Map();

  async create(data: any): Promise<User> {
    // In-memory implementation
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.users.get(email.toLowerCase()) || null;
  }

  // ... other methods
}
```

Benefits:
- Fast execution (no database)
- Predictable state
- Easy to test edge cases
- No test pollution

### 4. **Test Coverage Goals**

- **Entities**: 100% coverage of business logic
- **Use Cases**: Test all paths (success, validation errors, edge cases)
- **Repositories**: Integration tests with real database (future)
- **API Routes**: Integration tests with mocked auth (future)

## Adding New Tests

### 1. Entity Tests

When creating a new entity:

```typescript
// test/domain/entities/MyEntity.test.ts
import { describe, it, expect } from 'vitest';
import { MyEntity } from '@/domain/entities/MyEntity';

describe('MyEntity', () => {
  describe('Validation', () => {
    it('should validate required fields', () => {
      // Test validation logic
    });
  });

  describe('Business Logic', () => {
    it('should execute business rules', () => {
      // Test business methods
    });
  });
});
```

### 2. Use Case Tests

When creating a new use case:

```typescript
// test/domain/services/MyUseCase.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { MyUseCase } from '@/domain/services/MyUseCase';

// Create mock repositories
class MockRepository implements IRepository {
  // Mock implementation
}

describe('MyUseCase', () => {
  let useCase: MyUseCase;
  let mockRepo: MockRepository;

  beforeEach(() => {
    mockRepo = new MockRepository();
    useCase = new MyUseCase(mockRepo);
  });

  it('should handle success case', async () => {
    // Test happy path
  });

  it('should handle validation errors', async () => {
    // Test validation
  });

  it('should handle repository errors', async () => {
    // Test error handling
  });
});
```

## Best Practices

### ✅ DO

- Test business logic, not implementation details
- Use descriptive test names
- Test both success and failure paths
- Mock external dependencies
- Keep tests isolated (no shared state)
- Use `beforeEach` for setup
- Test edge cases

### ❌ DON'T

- Test private methods directly
- Rely on test execution order
- Use real database in unit tests
- Skip error cases
- Write flaky tests
- Test framework code

## Continuous Integration

Tests run automatically on:

- Pre-commit hooks (future)
- Pull requests (future)
- Main branch pushes (future)

## Future Additions

Planned test additions:

- [ ] Repository integration tests (with test database)
- [ ] API route integration tests
- [ ] Email service tests
- [ ] Campaign use case tests
- [ ] E2E tests with Playwright
- [ ] Performance tests

## Troubleshooting

### Tests fail with "Cannot find module"

```bash
npm install
```

### Tests timeout

Increase timeout in vitest.config.ts:

```typescript
test: {
  testTimeout: 10000, // 10 seconds
}
```

### Coverage not generating

Install coverage provider:

```bash
npm install -D @vitest/coverage-v8
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Clean Architecture Testing](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
