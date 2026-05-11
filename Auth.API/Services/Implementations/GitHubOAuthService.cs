using System.Net.Http.Headers;
using System.Text.Json;
using Auth.API.Configuration;
using Auth.API.Data;
using Auth.API.Models.Entities;
using Auth.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Auth.API.Services.Implementations;

public class GitHubOAuthService : IOAuthService
{
    private readonly GitHubOAuthSettings _settings;
    private readonly AppDbContext _context;
    private readonly HttpClient _httpClient;

    public GitHubOAuthService(IOptions<GitHubOAuthSettings> settings, AppDbContext context, HttpClient httpClient)
    {
        _settings = settings.Value;
        _context = context;
        _httpClient = httpClient;
    }

    public string GetAuthorizationUrl()
    {
        var scopes = "user:email";
        return $"https://github.com/login/oauth/authorize?client_id={_settings.ClientId}&redirect_uri={Uri.EscapeDataString(_settings.RedirectUri)}&scope={scopes}";
    }

    public async Task<string> ExchangeCodeForTokenAsync(string code)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, "https://github.com/login/oauth/access_token");
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        var content = new FormUrlEncodedContent(new[]
        {
            new KeyValuePair<string, string>("client_id", _settings.ClientId),
            new KeyValuePair<string, string>("client_secret", _settings.ClientSecret),
            new KeyValuePair<string, string>("code", code),
            new KeyValuePair<string, string>("redirect_uri", _settings.RedirectUri)
        });

        request.Content = content;
        var response = await _httpClient.SendAsync(request);
        response.EnsureSuccessStatusCode();

        var responseBody = await response.Content.ReadAsStringAsync();
        var tokenResponse = JsonSerializer.Deserialize<JsonElement>(responseBody);

        return tokenResponse.GetProperty("access_token").GetString() ?? throw new Exception("Failed to get access token");
    }

    public async Task<GitHubUserProfile> GetUserProfileAsync(string accessToken)
    {
        var userRequest = new HttpRequestMessage(HttpMethod.Get, "https://api.github.com/user");
        userRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        userRequest.Headers.UserAgent.Add(new ProductInfoHeaderValue("AuthAPI", "1.0"));

        var userResponse = await _httpClient.SendAsync(userRequest);
        userResponse.EnsureSuccessStatusCode();

        var userBody = await userResponse.Content.ReadAsStringAsync();
        var userJson = JsonSerializer.Deserialize<JsonElement>(userBody);

        var emailRequest = new HttpRequestMessage(HttpMethod.Get, "https://api.github.com/user/emails");
        emailRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        emailRequest.Headers.UserAgent.Add(new ProductInfoHeaderValue("AuthAPI", "1.0"));

        var emailResponse = await _httpClient.SendAsync(emailRequest);
        emailResponse.EnsureSuccessStatusCode();

        var emailBody = await emailResponse.Content.ReadAsStringAsync();
        var emails = JsonSerializer.Deserialize<JsonElement>(emailBody);

        var primaryEmail = emails.EnumerateArray()
            .FirstOrDefault(e => e.GetProperty("primary").GetBoolean())
            .GetProperty("email")
            .GetString() ?? throw new Exception("No primary email found");

        var name = userJson.GetProperty("name").GetString() ?? userJson.GetProperty("login").GetString() ?? "GitHub User";
        var nameParts = name.Split(' ', 2);

        return new GitHubUserProfile(
            userJson.GetProperty("id").GetInt64().ToString(),
            userJson.GetProperty("login").GetString() ?? throw new Exception("No login found"),
            primaryEmail,
            name
        );
    }

    public async Task<User> FindOrCreateUserAsync(GitHubUserProfile profile)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.GitHubId == profile.Id);

        if (user == null)
        {
            var nameParts = profile.Name.Split(' ', 2);
            user = new User
            {
                Email = profile.Email,
                FirstName = nameParts[0],
                LastName = nameParts.Length > 1 ? nameParts[1] : string.Empty,
                GitHubId = profile.Id,
                GitHubUsername = profile.Login,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();
        }

        return user;
    }
}
