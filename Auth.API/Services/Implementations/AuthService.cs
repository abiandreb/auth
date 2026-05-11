using Auth.API.Configuration;
using Auth.API.Data;
using Auth.API.Models.Entities;
using Auth.API.Models.Requests;
using Auth.API.Models.Responses;
using Auth.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using BCrypt.Net;

namespace Auth.API.Services.Implementations;

public class AuthService : IAuthService
{
    private readonly AppDbContext _context;
    private readonly ITokenService _tokenService;
    private readonly JwtSettings _jwtSettings;

    public AuthService(AppDbContext context, ITokenService tokenService, IOptions<JwtSettings> jwtSettings)
    {
        _context = context;
        _tokenService = tokenService;
        _jwtSettings = jwtSettings.Value;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        if (await _context.Users.AnyAsync(u => u.Email == request.Email))
        {
            throw new InvalidOperationException("User with this email already exists");
        }

        var user = new User
        {
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password, workFactor: 12),
            FirstName = request.FirstName,
            LastName = request.LastName,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var accessToken = _tokenService.GenerateAccessToken(user);
        var refreshToken = _tokenService.GenerateRefreshToken();

        await SaveRefreshTokenAsync(user, refreshToken);

        return new AuthResponse(
            accessToken,
            refreshToken,
            new UserDto(user.Id, user.Email, user.FirstName, user.LastName, user.GitHubUsername)
        );
    }

    public async Task<AuthResponse?> LoginAsync(LoginRequest request)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);

        if (user == null || user.PasswordHash == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            return null;
        }

        var accessToken = _tokenService.GenerateAccessToken(user);
        var refreshToken = _tokenService.GenerateRefreshToken();

        await SaveRefreshTokenAsync(user, refreshToken);

        return new AuthResponse(
            accessToken,
            refreshToken,
            new UserDto(user.Id, user.Email, user.FirstName, user.LastName, user.GitHubUsername)
        );
    }

    public async Task<AuthResponse?> RefreshTokenAsync(RefreshTokenRequest request)
    {
        var refreshToken = await _context.RefreshTokens
            .Include(rt => rt.User)
            .FirstOrDefaultAsync(rt => rt.Token == request.RefreshToken);

        if (refreshToken == null || !refreshToken.IsActive)
        {
            return null;
        }

        var newAccessToken = _tokenService.GenerateAccessToken(refreshToken.User);
        var newRefreshToken = _tokenService.GenerateRefreshToken();

        refreshToken.RevokedAt = DateTime.UtcNow;
        refreshToken.ReplacedByToken = newRefreshToken;

        await SaveRefreshTokenAsync(refreshToken.User, newRefreshToken);
        await _context.SaveChangesAsync();

        return new AuthResponse(
            newAccessToken,
            newRefreshToken,
            new UserDto(
                refreshToken.User.Id,
                refreshToken.User.Email,
                refreshToken.User.FirstName,
                refreshToken.User.LastName,
                refreshToken.User.GitHubUsername
            )
        );
    }

    public async Task<bool> LogoutAsync(RefreshTokenRequest request)
    {
        var refreshToken = await _context.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.Token == request.RefreshToken);

        if (refreshToken == null || refreshToken.IsRevoked)
        {
            return false;
        }

        refreshToken.RevokedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task SaveRefreshTokenAsync(User user, string token)
    {
        var refreshToken = new RefreshToken
        {
            UserId = user.Id,
            Token = token,
            ExpiresAt = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpirationDays),
            CreatedAt = DateTime.UtcNow
        };

        _context.RefreshTokens.Add(refreshToken);
        await _context.SaveChangesAsync();
    }

    public async Task RevokeRefreshTokenAsync(string token)
    {
        var refreshToken = await _context.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.Token == token);

        if (refreshToken != null && !refreshToken.IsRevoked)
        {
            refreshToken.RevokedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }
    }
}
