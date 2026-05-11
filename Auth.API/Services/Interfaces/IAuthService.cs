using Auth.API.Models.Entities;
using Auth.API.Models.Requests;
using Auth.API.Models.Responses;

namespace Auth.API.Services.Interfaces;

public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest request);
    Task<AuthResponse?> LoginAsync(LoginRequest request);
    Task<AuthResponse?> RefreshTokenAsync(RefreshTokenRequest request);
    Task<bool> LogoutAsync(RefreshTokenRequest request);
    Task SaveRefreshTokenAsync(User user, string token);
    Task RevokeRefreshTokenAsync(string token);
}
