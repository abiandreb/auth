using Auth.API.Models.Requests;
using Auth.API.Models.Responses;
using Auth.API.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Auth.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IOAuthService _oauthService;
    private readonly ITokenService _tokenService;

    public AuthController(IAuthService authService, IOAuthService oauthService, ITokenService tokenService)
    {
        _authService = authService;
        _oauthService = oauthService;
        _tokenService = tokenService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        try
        {
            var response = await _authService.RegisterAsync(request);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var response = await _authService.LoginAsync(request);

        if (response == null)
        {
            return Unauthorized(new { message = "Invalid email or password" });
        }

        return Ok(response);
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequest request)
    {
        var response = await _authService.RefreshTokenAsync(request);

        if (response == null)
        {
            return Unauthorized(new { message = "Invalid or expired refresh token" });
        }

        return Ok(response);
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout([FromBody] RefreshTokenRequest request)
    {
        var success = await _authService.LogoutAsync(request);

        if (!success)
        {
            return BadRequest(new { message = "Invalid refresh token" });
        }

        return Ok(new { message = "Logged out successfully" });
    }

    [HttpGet("github")]
    public IActionResult GitHubLogin()
    {
        var authUrl = _oauthService.GetAuthorizationUrl();
        return Redirect(authUrl);
    }

    [HttpGet("github/callback")]
    public async Task<IActionResult> GitHubCallback([FromQuery] string code)
    {
        try
        {
            var accessToken = await _oauthService.ExchangeCodeForTokenAsync(code);
            var profile = await _oauthService.GetUserProfileAsync(accessToken);
            var user = await _oauthService.FindOrCreateUserAsync(profile);

            var jwtToken = _tokenService.GenerateAccessToken(user);
            var refreshToken = _tokenService.GenerateRefreshToken();

            await _authService.SaveRefreshTokenAsync(user, refreshToken);

            var frontendUrl = "http://localhost:3000/auth/callback";
            return Redirect($"{frontendUrl}?accessToken={jwtToken}&refreshToken={refreshToken}");
        }
        catch (Exception ex)
        {
            return Redirect($"http://localhost:3000/login?error={Uri.EscapeDataString(ex.Message)}");
        }
    }
}
