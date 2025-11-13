using System.Runtime.InteropServices.JavaScript;
using System.Security.Policy;
using BCrypt.Net;
using Microsoft.AspNetCore.Identity;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace Сoursework.Models;

[BsonIgnoreExtraElements]
public class User
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; }

    [BsonElement("userName")] public string UserName { get; set; }

    [BsonElement("passwordHash")] public string PasswordHash { get; set; }

    [BsonElement("role")]
    [BsonRepresentation(BsonType.String)]
    public Role UserRole { get; set; }

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; }

    // Optional fields
    [BsonElement("fullName")]
    public string? FullName { get; set; }
    [BsonElement("phone")]
    public string? Phone { get; set; }
    [BsonElement("address")]
    public string? Address { get; set; }

    // Special fields
    [BsonElement("medicalRecordNumber")]
    public int? MedicalRecordNumber { get; set; } // Patient
    [BsonElement("dateOfBirth")]
    public DateTime? DateOfBirth { get; set; } // Patient, Specialist
    [BsonElement("speciality")]
    public string? Speciality { get; set; } // Specialist
    
    public User()
    {
        Id = ObjectId.GenerateNewId().ToString();
        CreatedAt = DateTime.UtcNow;
    }

    public User(string userName, string passwordHash, Role userRole) : this()
    {
        UserName = userName;
        PasswordHash = passwordHash;
        UserRole = userRole;
    }

    public User(string userName, string passwordHash, Role userRole, string fullName) : this(userName, passwordHash,
        userRole)
    {
        FullName = fullName;
    }

    public User(string userName, string passwordHash, Role userRole, string fullName, string phone, string address)
        : this(userName, passwordHash, userRole, fullName)
    {
        Phone = phone;
        Address = address;
    }
    
    // public void SetPasswordHash(string password)
    // {
    //     if (string.IsNullOrWhiteSpace(password))
    //         throw new ArgumentException("Password hash cannot be null or empty", nameof(password));
    //
    //     PasswordHash = BCrypt.Net.BCrypt.HashPassword(password);
    // }
    public void SetPasswordHash(string password, IPasswordHasher<User> hasher)
    {
        if (string.IsNullOrWhiteSpace(password))
            throw new ArgumentException("Password cannot be empty.", nameof(password));

        PasswordHash = hasher.HashPassword(this, password);
    }

    public void SetUserRole(Role role)
    {
        UserRole = role;
    }
    
    public void setUserRole_string(String userRole)
    {
        try
        {
            this.UserRole = Enum.Parse<Role>(userRole);
        }
        catch (ArgumentException e)
        {
            this.UserRole = Role.Guest;
        }
    }

    public void SetFullName(string fullName)
    {
        FullName = fullName;
    }

    public void SetContactInfo(string phone, string address)
    {
        Phone = phone;
        Address = address;
    }

    //Patient methods
    public void SetPatientInfo(int medicalRecordNumber, DateTime? dateOfBirth = null)
    {
        if (UserRole != Role.Patient)
            throw new InvalidOperationException("Can only set patient info for users with Patient role");

        MedicalRecordNumber = medicalRecordNumber;
        DateOfBirth = dateOfBirth;
    }

    //Specialist methods
    public void SetSpecialistInfo(string speciality, DateTime? dateOfBirth = null)
    {
        if (UserRole != Role.Specialist)
            throw new InvalidOperationException("Can only set specialist info for users with Specialist role");

        Speciality = speciality;
        DateOfBirth = dateOfBirth;
    }
    
    public bool IsPatient() => UserRole == Role.Patient;
    public bool IsSpecialist() => UserRole == Role.Specialist;
    public bool IsAdmin() => UserRole == Role.Administrator;
    public bool IsOperator() => UserRole == Role.Operator;
    public bool IsGuest() => UserRole == Role.Guest;

    public bool HasCompleteProfile()
    {
        return UserRole switch
        {
            Role.Patient => !string.IsNullOrEmpty(FullName) && !string.IsNullOrEmpty(Phone) &&
                            MedicalRecordNumber.HasValue,
            Role.Specialist => !string.IsNullOrEmpty(FullName) && !string.IsNullOrEmpty(Speciality),
            Role.Administrator or Role.Operator => !string.IsNullOrEmpty(FullName) && !string.IsNullOrEmpty(Phone),
            Role.Guest => true,
            _ => false
        };
    }

    public override string ToString()
    {
        return $"{FullName ?? UserName} ({UserRole})";
    }
    
    public void ShowInfo()
    {
        Console.WriteLine("=== USER INFORMATION ===");
        Console.WriteLine($"ID: {Id}");
        Console.WriteLine($"Username: {UserName}");
        Console.WriteLine($"Role: {UserRole}");
        Console.WriteLine($"Created at: {CreatedAt:yyyy-MM-dd HH:mm}");

        if (!string.IsNullOrWhiteSpace(FullName))
            Console.WriteLine($"Full name: {FullName}");

        if (!string.IsNullOrWhiteSpace(Phone))
            Console.WriteLine($"Phone: {Phone}");

        if (!string.IsNullOrWhiteSpace(Address))
            Console.WriteLine($"Address: {Address}");

        if (UserRole == Role.Patient)
        {
            if (MedicalRecordNumber.HasValue)
                Console.WriteLine($"Medical record number: {MedicalRecordNumber}");
            if (DateOfBirth.HasValue)
                Console.WriteLine($"Date of birth: {DateOfBirth:yyyy-MM-dd}");
        }
        else if (UserRole == Role.Specialist)
        {
            if (!string.IsNullOrWhiteSpace(Speciality))
                Console.WriteLine($"Speciality: {Speciality}");
            if (DateOfBirth.HasValue)
                Console.WriteLine($"Date of birth: {DateOfBirth:yyyy-MM-dd}");
        }

        Console.WriteLine("========================\n");
    }
}