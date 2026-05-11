using System.Security.Claims;
using Auth.API.Data;
using Auth.API.Models.Responses;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Auth.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UserController : ControllerBase
{
    private readonly AppDbContext _context;

    public UserController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetCurrentUser()
    {
        var userIdClaim = User.FindFirst("userId")?.Value;

        if (userIdClaim == null || !int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(new { message = "Invalid token" });
        }

        var user = await _context.Users.FindAsync(userId);

        if (user == null)
        {
            return NotFound(new { message = "User not found" });
        }

        return Ok(new
        {
            id = user.Id,
            email = user.Email,
            firstName = user.FirstName,
            lastName = user.LastName,
            gitHubUsername = user.GitHubUsername,
            role = user.Role
        });
    }

    [HttpGet("data")]
    public IActionResult GetProtectedData()
    {
        var data = new List<string>
        {
            "Protected Item 1",
            "Protected Item 2",
            "Protected Item 3",
            "Protected Item 4",
            "Protected Item 5"
        };

        return Ok(new UserDataResponse("This is protected data", data));
    }

    [HttpGet("admin")]
    [Authorize(Roles = "Admin")]
    public IActionResult GetAdminData()
    {
        return Ok(new
        {
            message = "Admin access granted",
            data = new List<string>
            {
                "Admin Item 1",
                "Admin Item 2",
                "Admin Item 3"
            }
        });
    }

    [HttpGet("public")]
    [AllowAnonymous]
    public IActionResult GetPublicData()
    {
        return Ok(new
        {
            message = "This is public data - no authentication required",
            data = new List<string>
            {
                "Public Item 1",
                "Public Item 2",
                "Public Item 3"
            }
        });
    }
}
