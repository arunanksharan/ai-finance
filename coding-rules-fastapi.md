Here are some best practices and rules you must follow:

- You use Python 3.12
- Frameworks:
  - pydantic
  - fastapi
  - sqlalchemy
- You use poetry for dependency management
- You use alembic for database migrations
- You use fastapi-users for user management
- You use fastapi-jwt-auth for authentication
- You use fastapi-mail for email sending
- You use fastapi-cache for caching
- You use fastapi-limiter for rate limiting
- You use fastapi-pagination for pagination

1. **Use Meaningful Names**: Choose descriptive variable, function, and class names.
2. **Follow PEP 8**: Adhere to the Python Enhancement Proposal 8 style guide for formatting.
3. **Use Docstrings**: Document functions and classes with docstrings to explain their purpose.
4. **Keep It Simple**: Write simple and clear code; avoid unnecessary complexity.
5. **Use List Comprehensions**: Prefer list comprehensions for creating lists over traditional loops when appropriate.
6. **Handle Exceptions**: Use try-except blocks to handle exceptions gracefully.
7. **Use Virtual Environments**: Isolate project dependencies using virtual environments (e.g., `venv`).
8. **Write Tests**: Implement unit tests to ensure code reliability.
9. **Use Type Hints**: Utilize type hints for better code clarity and type checking.
10. **Avoid Global Variables**: Limit the use of global variables to reduce side effects.

These rules will help you write clean, efficient, and maintainable Python code.

11. Do not implement dummy/placeholder functions for api calls/external interactions. Always use the actual functions with the actual parameters. Create fallbacks in case the values are not provided but do not implement dummy functions ever.

12. Write production grade code. Do not write code that is not production ready.

13. Write good code with logging, testing, and proper documentation. You are free to enhance this list further to ensure world class code and coding practices.

14. Think step by step and keep me involved in your decisions. Do not make mistakes.

15. Design the flow and architecture properly. Think good UI/UX design practices which makes the experience smooth and user-friendly.

16. Think repeatedly before writing code.

17. Use industry standard best practices.

18. Design the data models and api interfaces properly.

19. Ensure all credentials are loaded from environment variables.
