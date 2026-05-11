namespace Auth.API.Models.Responses;

public record UserDataResponse(
    string Message,
    List<string> Data
);
