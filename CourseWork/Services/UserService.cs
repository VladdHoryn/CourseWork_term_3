

using CourseWork.DTOs;
using Сoursework.Models;
using Сoursework.Repositories;

namespace Сoursework.Services;

public class UserService
{
    private readonly UserRepository _userRepo;

    public UserService(UserRepository userRepo)
    {
        _userRepo = userRepo;
    }

    public List<User> GetAllUsers()
    {
        try
        {
            return _userRepo.GetAllUsers();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Error] Failed to retrieve users: {ex.Message}");
            return new List<User>();
        }
    }

    public User GetUserByName(string username)
    {
        try
        {
            var user = _userRepo.GetUserByName(username);
            if (user == null)
                throw new KeyNotFoundException($"User '{username}' not found.");

            return user;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Error] Cannot get user '{username}': {ex.Message}");
            throw;
        }
    }

    public bool CreateUser(User newUser, string password)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(password))
                throw new ArgumentException("Password cannot be empty.");

            if (_userRepo.GetUserByName(newUser.UserName) != null)
                throw new InvalidOperationException("User already exists.");

            newUser.SetPasswordHash(password);
            _userRepo.CreateUser(newUser);
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Error] Failed to create user: {ex.Message}");
            return false;
        }
    }

    public bool UpdatePassword(string username, string newPassword)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(newPassword))
                throw new ArgumentException("New password cannot be empty.");

            _userRepo.UpdatePassword(username, newPassword);
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Error] Cannot update password for {username}: {ex.Message}");
            return false;
        }
    }

    public bool DeleteUser(string username)
    {
        try
        {
            var existing = _userRepo.GetUserByName(username);
            if (existing == null)
                throw new KeyNotFoundException($"User '{username}' not found.");

            _userRepo.DeleteUser(username);
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Error] Cannot delete user '{username}': {ex.Message}");
            return false;
        }
    }
    
    public bool RegisterUser(RegistrationRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.UserName) || string.IsNullOrWhiteSpace(request.Password))
            throw new ArgumentException("Username and password are required.");

        if (_userRepo.GetUserByName(request.UserName) != null)
            throw new InvalidOperationException("User already exists.");

        var role = Enum.TryParse<Role>(request.Role, true, out var parsedRole) ? parsedRole : Role.Guest;
        var user = new User(request.UserName, BCrypt.Net.BCrypt.HashPassword(request.Password), role)
        {
            FullName = request.FullName,
            Phone = request.Phone,
            Address = request.Address,
            Speciality = request.Speciality,
            DateOfBirth = request.DateOfBirth,
            MedicalRecordNumber = request.MedicalRecordNumber
        };

        _userRepo.CreateUser(user);
        return true;
    }

    public User Login(LoginRequest request)
    {
        var user = _userRepo.GetUserByName(request.UserName)
                   ?? throw new KeyNotFoundException("User not found.");

        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Invalid password.");

        return user;
    }
}
