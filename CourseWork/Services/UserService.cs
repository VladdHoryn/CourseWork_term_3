using CourseWork.DTOs;
using Microsoft.AspNetCore.Identity;
using Сoursework.Models;
using Сoursework.Repositories;

namespace Сoursework.Services;

public class UserService
{
    private readonly UserRepository _userRepo;
    private readonly PasswordHasher<User> _hasher = new();

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
            var user = _userRepo.GetByName(username);
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

    public User GetById(string Id)
    {
        try
        {
            var user = _userRepo.GetById(Id);
            if (user == null)
                throw new KeyNotFoundException($"User '{Id}' not found.");

            return user;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Error] Cannot get user '{Id}': {ex.Message}");
            throw;
        }
    }

    public bool CreateUser(User newUser, string password)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(password))
                throw new ArgumentException("Password cannot be empty.");

            if (_userRepo.GetByName(newUser.UserName) != null)
                throw new InvalidOperationException("User already exists.");

            newUser.SetPasswordHash(password, new PasswordHasher<User>());
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

            _userRepo.UpdatePassword(username, newPassword, _hasher);
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Error] Cannot update password for {username}: {ex.Message}");
            return false;
        }
    }

    public bool UpdateUser(User updated)
    {
        try
        {
            var existing = _userRepo.GetById(updated.Id);
            if (existing == null)
                throw new KeyNotFoundException($"User Id '{updated.Id}' not found.");

            // ------------------------ BASIC FIELDS ------------------------
            if (!string.IsNullOrWhiteSpace(updated.UserName))
                existing.UserName = updated.UserName;

            if (!string.IsNullOrWhiteSpace(updated.FullName))
                existing.FullName = updated.FullName;

            if (!string.IsNullOrWhiteSpace(updated.Phone))
                existing.Phone = updated.Phone;

            if (!string.IsNullOrWhiteSpace(updated.Address))
                existing.Address = updated.Address;

            // ------------------------ ROLE ------------------------
            // Якщо роль змінилася — дозволяємо оновлення
            if (updated.UserRole != existing.UserRole)
                existing.UserRole = updated.UserRole;

            // ------------------------ PASSWORD ------------------------
            if (!string.IsNullOrWhiteSpace(updated.PasswordHash))
            {
                existing.PasswordHash = updated.PasswordHash;
            }

            // ------------------------ ROLE SPECIFIC ------------------------
            switch (existing.UserRole)
            {
                case Role.Patient:
                    if (updated.MedicalRecordNumber.HasValue)
                        existing.MedicalRecordNumber = updated.MedicalRecordNumber.Value;

                    if (updated.DateOfBirth.HasValue)
                        existing.DateOfBirth = updated.DateOfBirth.Value;
                    break;

                case Role.Specialist:
                    if (!string.IsNullOrWhiteSpace(updated.Speciality))
                        existing.Speciality = updated.Speciality;

                    if (updated.DateOfBirth.HasValue)
                        existing.DateOfBirth = updated.DateOfBirth.Value;
                    break;
            }

            // ------------------------ SAVE ------------------------
            _userRepo.UpdateUser(existing);

            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Error] Cannot update user '{updated.UserName}': {ex.Message}");
            return false;
        }
    }

    public bool DeleteUser(string id)
    {
        try
        {
            var existing = _userRepo.GetById(id);
            if (existing == null)
                throw new KeyNotFoundException($"Id '{id}' not found.");

            _userRepo.DeleteUser(id);
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Error] Cannot delete user '{id}': {ex.Message}");
            return false;
        }
    }

    public User Login(LoginRequest request)
    {
        var user = _userRepo.GetByName(request.UserName)
                   ?? throw new KeyNotFoundException("User not found.");

        var verificationResult = _hasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);

        if (verificationResult == PasswordVerificationResult.Failed)
            throw new UnauthorizedAccessException("Invalid password.");

        return user;
    }
}