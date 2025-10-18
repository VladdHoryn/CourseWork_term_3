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

    public List<User> GetPatientsBySurname(string surname)
    {
        try
        {
            return _userRepo.GetPatientsBySurname(surname);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Error] Failed to search patients by surname: {ex.Message}");
            return new List<User>();
        }
    }

    public User GetPatientByMedicalRecord(int record)
    {
        try
        {
            var patient = _userRepo.GetPatientByMedicalRecord(record);
            if (patient == null)
                throw new KeyNotFoundException($"No patient found with record {record}");

            return patient;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Error] GetPatientByMedicalRecord failed: {ex.Message}");
            throw;
        }
    }
}
