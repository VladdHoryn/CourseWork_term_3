using Сoursework.Models;
using Сoursework.Repositories;

namespace Сoursework.Services;
using CourseWork.Models;
using CourseWork.Repositories;

public class RegistrationRequestService
{
    private readonly RegistrationRequestRepository _requestRepo;
    private readonly UserRepository _userRepo;

    public RegistrationRequestService(RegistrationRequestRepository requestRepo, UserRepository userRepo)
    {
        _requestRepo = requestRepo;
        _userRepo = userRepo;
    }

    // Guest submits a registration request
    public bool SubmitRegistrationRequest(string username, string password, string? fullName, string? phone, string? address)
    {
        if (_userRepo.GetByName(username) != null)
        {
            Console.WriteLine($"[Warning] Username '{username}' already exists.");
            return false;
        }

        var request = new RegistrationRequest(username, password)
        {
            FullName = fullName,
            Phone = phone,
            Address = address
        };

        _requestRepo.CreateRequest(request);
        Console.WriteLine($"[Info] Registration request for '{username}' submitted.");
        return true;
    }

    // Admin views pending requests
    public List<RegistrationRequest> GetPendingRequests()
    {
        return _requestRepo.GetPendingRequests();
    }

    // Admin approves a request → creates actual user
    public bool ApproveRequest(string requestId, Role initialRole = Role.Patient)
    {
        var request = _requestRepo.GetRequestById(requestId);
        if (request == null || request.Status != RequestStatus.Pending)
        {
            Console.WriteLine($"[Error] Request not found or already processed.");
            return false;
        }
        
        var nextMrn = _userRepo.GetNextMedicalRecordNumber();

        var newUser = new User(request.UserName, request.PasswordHash, initialRole)
        {
            FullName = request.FullName,
            Phone = request.Phone,
            Address = request.Address,
            MedicalRecordNumber = nextMrn
        };

        _userRepo.CreateUser(newUser);
        _requestRepo.UpdateStatus(requestId, RequestStatus.Approved);

        Console.WriteLine($"[Success] Request approved. User '{newUser.UserName}' created with role {initialRole}.");
        return true;
    }

    // Admin rejects a request
    public bool RejectRequest(string requestId)
    {
        var request = _requestRepo.GetRequestById(requestId);
        if (request == null)
        {
            Console.WriteLine($"[Error] Request not found.");
            return false;
        }

        _requestRepo.UpdateStatus(requestId, RequestStatus.Rejected);
        Console.WriteLine($"[Info] Registration request for '{request.UserName}' rejected.");
        return true;
    }
}
