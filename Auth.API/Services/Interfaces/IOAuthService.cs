using Auth.API.Models.Entities;

namespace Auth.API.Services.Interfaces;

public interface IOAuthService
{
    string GetAuthorizationUrl();
    Task<string> ExchangeCodeForTokenAsync(string code);
    Task<GitHubUserProfile> GetUserProfileAsync(string accessToken);
    Task<User> FindOrCreateUserAsync(GitHubUserProfile profile);
}

public record GitHubUserProfile(
    string Id,
    string Login,
    string Email,
    string Name
);
