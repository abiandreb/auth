using Auth.API.Models.Entities;

namespace Auth.API.Services.Interfaces;

public interface ITokenService
{
    string GenerateAccessToken(User user);
    string GenerateRefreshToken();
    bool ValidateToken(string token);
    int? GetUserIdFromToken(string token);
}
