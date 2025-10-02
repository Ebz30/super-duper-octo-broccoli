# Contributing to MyBazaar

Thank you for your interest in contributing to MyBazaar! This document provides guidelines and instructions for contributing.

## Code of Conduct

### Our Pledge
We are committed to providing a welcoming and inspiring community for all. Please be respectful and constructive in your interactions.

### Our Standards
- Use welcoming and inclusive language
- Be respectful of differing viewpoints
- Accept constructive criticism gracefully
- Focus on what is best for the community
- Show empathy towards others

## How to Contribute

### Reporting Bugs

Before creating a bug report, please check existing issues to avoid duplicates.

**Bug Report Template:**
```markdown
**Describe the bug**
A clear description of the bug.

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g., Windows 10, macOS 12]
- Browser: [e.g., Chrome 96, Firefox 95]
- Version: [e.g., 1.0.0]

**Additional context**
Any other relevant information.
```

### Suggesting Features

We welcome feature suggestions! Please provide:
- Clear description of the feature
- Use cases and benefits
- Potential implementation approach (optional)
- Mockups or examples (if applicable)

### Pull Requests

1. **Fork the repository**
   ```bash
   git clone https://github.com/Ebz30/super-duper-octo-broccoli.git
   cd super-duper-octo-broccoli
   ```

2. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/bug-description
   ```

3. **Make your changes**
   - Follow the code style guide below
   - Write clear commit messages
   - Add tests if applicable
   - Update documentation

4. **Test your changes**
   ```bash
   # Backend
   cd backend
   npm test

   # Frontend
   cd frontend
   npm test
   ```

5. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   # or
   git commit -m "fix: resolve bug in messaging"
   ```

6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create Pull Request**
   - Go to the original repository
   - Click "New Pull Request"
   - Select your branch
   - Fill in the PR template
   - Submit!

## Code Style Guide

### JavaScript/React

- Use ES6+ features
- Use functional components with hooks (React)
- 2 spaces for indentation
- Single quotes for strings
- Semicolons required
- Meaningful variable names

**Good:**
```javascript
const getUserById = async (userId) => {
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
  return result.rows[0];
};
```

**Bad:**
```javascript
function x(id){
    var r=pool.query("SELECT * FROM users WHERE id="+id)
    return r.rows[0]
}
```

### CSS

- Use CSS variables for colors and spacing
- Mobile-first approach
- BEM naming convention preferred
- Avoid inline styles

**Good:**
```css
.item-card {
  background-color: white;
  border-radius: var(--radius-lg);
}

.item-card__title {
  color: var(--gray-900);
}
```

### Git Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance tasks

**Examples:**
```
feat: add user profile editing
fix: resolve WebSocket reconnection issue
docs: update API documentation
style: format code with prettier
refactor: extract validation logic
test: add unit tests for auth service
chore: update dependencies
```

## Development Workflow

### Setting Up Development Environment

1. **Install dependencies**
   ```bash
   # Backend
   cd backend
   npm install

   # Frontend
   cd frontend
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   # Edit .env files with your local configuration
   ```

3. **Start development servers**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev

   # Terminal 2 - Frontend
   cd frontend
   npm start
   ```

### Project Structure

```
mybazaar/
├── backend/
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API routes
│   │   ├── utils/          # Utility functions
│   │   ├── websocket/      # WebSocket server
│   │   └── server.js       # Main server file
│   ├── uploads/            # Uploaded files
│   └── package.json
├── frontend/
│   ├── public/             # Static files
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── context/        # React context
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── styles/         # CSS files
│   │   ├── App.js          # Main app component
│   │   └── index.js        # Entry point
│   └── package.json
├── database-schema.sql     # Database schema
├── README.md
└── DEPLOYMENT.md
```

## Testing Guidelines

### Backend Testing

- Write unit tests for utility functions
- Write integration tests for API endpoints
- Test error handling
- Test authentication and authorization

**Example:**
```javascript
describe('Auth API', () => {
  it('should register a new user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'SecurePass123!'
      });
    
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
  });
});
```

### Frontend Testing

- Write component tests with React Testing Library
- Test user interactions
- Test API integration
- Test error states

**Example:**
```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import Login from './Login';

test('renders login form', () => {
  render(<Login />);
  expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
});
```

## Documentation

- Update README.md for major changes
- Add JSDoc comments for functions
- Update API documentation
- Include examples where helpful

**JSDoc Example:**
```javascript
/**
 * Validate item data before creation
 * @param {Object} itemData - Item data to validate
 * @param {string} itemData.title - Item title (3-200 chars)
 * @param {number} itemData.price - Item price (0-999999.99)
 * @returns {Object} Validation result with valid flag and errors
 */
function validateItem(itemData) {
  // ...
}
```

## Review Process

1. **Automated Checks**
   - Linting passes
   - Tests pass
   - Build succeeds

2. **Code Review**
   - At least one maintainer approval
   - Address review comments
   - Keep discussions professional

3. **Merge**
   - Squash commits if requested
   - Maintainer will merge

## Areas for Contribution

### High Priority
- [ ] Mobile app (React Native)
- [ ] Email notification system
- [ ] User verification
- [ ] Advanced analytics
- [ ] Performance optimizations

### Medium Priority
- [ ] Arabic/Turkish translations
- [ ] Video upload support
- [ ] Advanced search filters
- [ ] Seller ratings system
- [ ] Payment integration

### Low Priority
- [ ] Dark mode
- [ ] Accessibility improvements
- [ ] PWA features
- [ ] Export data feature

### Good First Issues

Look for issues labeled `good-first-issue` - these are great for new contributors!

## Community

- GitHub Discussions: Ask questions, share ideas
- Issues: Report bugs, request features
- Email: mybazaarsupp@gmail.com

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Questions?

Don't hesitate to ask! Open an issue or send an email to mybazaarsupp@gmail.com

Thank you for contributing to MyBazaar! 🎓
