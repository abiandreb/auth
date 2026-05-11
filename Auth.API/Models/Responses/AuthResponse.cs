namespace Auth.API.Models.Responses;

public record AuthResponse(
    string AccessToken,
    string RefreshToken,
    UserDto User
);

public record UserDto(
    int Id,
    string Email,
    string FirstName,
    string LastName,
    string? GitHubUsername
);
