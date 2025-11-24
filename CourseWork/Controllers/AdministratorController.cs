using CourseWork.DTOs;
using CourseWork.Mappers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using MongoDB.Driver;
using Сoursework.Models;
using Сoursework.Repositories;
using Сoursework.Services;

namespace CourseWork.Controllers;

[Authorize(Roles = "Administrator")]
[ApiController]
[Route("administrator")]
public class AdministratorController : ControllerBase
{
    private readonly AdministratorService _adminService;
    private readonly SpecialistService _specialistService;
    private readonly MongoDBRepository _repo;
    private readonly PasswordHasher<User> _hasher = new();

    public AdministratorController(AdministratorService adminService, MongoDBRepository repo, SpecialistService specialistService)
    {
        _adminService = adminService;
        _repo = repo;
        _specialistService = specialistService;
    }
    
    // public IMongoDatabase GetMongoDatabase()
    // {
    //     var client = new MongoClient(_connectionString); // твій MongoDB connection string
    //     var db = client.GetDatabase(_dbName);
    //     return db;
    // }

    // -------------------- Dashboard --------------------
    [HttpGet("dashboard")]
    public IActionResult Dashboard()
    {
        return Ok(new
        {
            Message = "Administrator dashboard is active",
            Sections = new[] { "users", "visits", "payments", "registration-requests", "statistics" }
        });
    }

    // -------------------- Admins & Users Management --------------------
    [HttpGet("admins")]
    public IActionResult GetAdmins()
    {
        var admins = _adminService.GetAllAdmins()
            .Select(UserMapper.ToDto)
            .ToList();
        return Ok(admins);
    }

    [HttpGet("users")]
    public IActionResult GetUsers()
    {
        var users = _adminService.GetAllUsers()
            .ToList();
        return Ok(users);
    }

    [HttpDelete("users/{id}")]
    public IActionResult DeleteUser(string id)
    {
        return _adminService.DeleteUserById(id)
            ? Ok("User deleted successfully")
            : BadRequest("Failed to delete user");
    }

    // -------------------- CREATE USER --------------------
    [HttpPost("users")]
    public IActionResult CreateUser([FromBody] User dto)
    {
        if (dto == null || string.IsNullOrWhiteSpace(dto.PasswordHash) || string.IsNullOrWhiteSpace(dto.UserName))
            return BadRequest("Invalid user data");

        var user = new User();
        user = new User(dto.UserName, string.Empty, dto.UserRole)
        {
            FullName = dto.FullName,
            Phone = dto.Phone,
            Address = dto.Address
        };

        // Set role-specific info
        switch (dto.UserRole)
        {
            case Role.Patient:
                if (!dto.MedicalRecordNumber.HasValue)
                    return BadRequest("MedicalRecordNumber is required for Patient");
                user.SetPatientInfo(dto.MedicalRecordNumber.Value, dto.DateOfBirth);
                break;
            case Role.Specialist:
                if (string.IsNullOrWhiteSpace(dto.Speciality))
                    return BadRequest("Speciality is required for Specialist");
                user.SetSpecialistInfo(dto.Speciality, dto.DateOfBirth);
                break;
        }

        user.SetPasswordHash(dto.PasswordHash, _hasher);

        var result = _adminService.CreateUser(user, dto.PasswordHash);
        return result ? Ok(UserMapper.ToDto(user)) : BadRequest("Failed to create user");
    }

    /// -------------------- UPDATE USER --------------------
    [HttpPut("users/{id}")]
    public IActionResult UpdateUser(string id, [FromBody] UpdateUserDtoAdmin dto)
    {
        var user = _adminService.GetById(id);
        if (user == null) return NotFound("User not found");

        if (!string.IsNullOrWhiteSpace(dto.UserName))
            user.UserName = dto.UserName;

        // ===================== BASIC FIELDS =====================
        if (!string.IsNullOrWhiteSpace(dto.FullName))
            user.SetFullName(dto.FullName);

        if (!string.IsNullOrWhiteSpace(dto.Phone) || !string.IsNullOrWhiteSpace(dto.Address))
        {
            string phone = string.IsNullOrWhiteSpace(dto.Phone) ? user.Phone : dto.Phone;
            string address = string.IsNullOrWhiteSpace(dto.Address) ? user.Address : dto.Address;
            user.SetContactInfo(phone, address);
        }

        // ===================== ROLE =====================
        if (dto.UserRole != user.UserRole)
            user.SetUserRole(dto.UserRole);

        // ===================== ROLE-SPECIFIC FIELDS =====================
        switch (user.UserRole)
        {
            case Role.Patient:
                if (dto.MedicalRecordNumber.HasValue)
                {
                    DateTime? dob = dto.DateOfBirth ?? user.DateOfBirth;
                    user.SetPatientInfo(dto.MedicalRecordNumber.Value, dob);
                }

                break;

            case Role.Specialist:
                if (!string.IsNullOrWhiteSpace(dto.Speciality))
                {
                    DateTime? dob = dto.DateOfBirth ?? user.DateOfBirth;
                    user.SetSpecialistInfo(dto.Speciality, dob);
                }

                break;
        }

        // ===================== PASSWORD =====================
        if (!string.IsNullOrWhiteSpace(dto.PasswordHash))
            user.SetPasswordHash(dto.PasswordHash, _hasher);

        var result = _adminService.UpdateUser(user);
        return result ? Ok(UserMapper.ToDto(user)) : BadRequest("Failed to update user");
    }


    // -------------------- Visits Management --------------------
    [HttpGet("visits")]
    public IActionResult GetVisits()
    {
        var visits = _adminService.GetAllVisits()
            .Select(VisitMapper.ToResponse)
            .ToList();
        return Ok(visits);
    }

    [HttpGet("visits/{id}")]
    public IActionResult GetVisitById(string id)
    {
        var visit = _adminService.GetVisitById(id);
        return visit != null ? Ok(VisitMapper.ToResponse(visit)) : NotFound("Visit not found");
    }

    [HttpPost("visits")]
    public IActionResult CreateVisit([FromBody] VisitRequestDto dto)
    {
        var visit = VisitMapper.ToVisit(dto, dto.PatientMedicalRecord, dto.SpecialistId);
        return _adminService.CreateVisit(visit)
            ? Ok("Visit created successfully")
            : BadRequest("Failed to create visit");
    }

    [HttpPut("visits/{id}")]
    public IActionResult UpdateVisit(string id, [FromBody] VisitUpdateDto dto)
    {
        var visit = _adminService.GetVisitById(id);
        if (visit == null) return NotFound("Visit not found");

        VisitMapper.ApplyUpdate(visit, dto);

        return _adminService.UpdateVisit(id, visit)
            ? Ok("Visit updated successfully")
            : BadRequest("Failed to update visit");
    }

    [HttpDelete("visits/{id}")]
    public IActionResult DeleteVisit(string id)
    {
        return _adminService.DeleteVisit(id)
            ? Ok("Visit deleted successfully")
            : BadRequest("Failed to delete visit");
    }

    [HttpGet("visits/total-cost")]
    public IActionResult GetTotalVisitCost([FromQuery] int recordNumber, [FromQuery] int year)
    {
        var total = _adminService.GetTotalVisitCostByYear(recordNumber, year);
        return Ok(new { RecordNumber = recordNumber, Year = year, TotalCost = total });
    }

    // -------------------- Payments Management --------------------
    [HttpGet("payments")]
    public IActionResult GetPayments()
    {
        var payments = _adminService.GetAllPayments()
            .Select(PaymentMapper.ToDto)
            .ToList();
        return Ok(payments);
    }

    [HttpGet("payments/{id}")]
    public IActionResult GetPaymentById(string id)
    {
        var payment = _adminService.GetPaymentById(id);
        return payment != null
            ? Ok(PaymentMapper.ToResponseDto(payment))
            : NotFound("Payment not found");
    }

    [HttpPost("payments")]
    public IActionResult CreatePayment([FromBody] PaymentCreateDto dto)
    {
        var payment = PaymentMapper.ToPayment(dto, dto.PatientMedicalRecord);
        return _adminService.CreatePayment(payment)
            ? Ok("Payment created")
            : BadRequest("Failed to create payment");
    }

    [HttpPut("payments/{id}")]
    public IActionResult UpdatePayment(string id, [FromBody] PaymentUpdateDto dto)
    {
        var existingPayment = _adminService.GetPaymentById(id);
        if (existingPayment == null)
            return NotFound("Payment not found");

        existingPayment.TotalAmount = dto.TotalAmount;
        existingPayment.PaidAmount = dto.PaidAmount;
        existingPayment.RemainingAmount = dto.RemainingAmount;
        existingPayment.IssuedDate = dto.IssuedDate;
        existingPayment.DueDate = dto.DueDate;
        existingPayment.LastPaymentDate = dto.LastPaymentDate;

        if (Enum.TryParse<PaymentStatus>(dto.Status, true, out var status))
        {
            existingPayment.Status = status;
        }
        else
        {
            return BadRequest("Invalid payment status value");
        }

        var result = _adminService.UpdatePayment(id, existingPayment);

        return result ? Ok("Payment updated") : BadRequest("Failed to update payment");
    }

    [HttpDelete("payments/{id}")]
    public IActionResult DeletePayment(string id)
    {
        return _adminService.DeletePayment(id)
            ? Ok("Payment deleted")
            : BadRequest("Delete failed");
    }

    [HttpGet("payments/revenue")]
    public IActionResult GetRevenueByPeriod([FromQuery] DateTime start, [FromQuery] DateTime end)
    {
        var revenue = _adminService.GetClinicRevenueByPeriod(start, end);
        return Ok(new { StartDate = start, EndDate = end, TotalRevenue = revenue });
    }

    // -------------------- Registration Requests --------------------Затестити
    [HttpGet("pending")]
    [Authorize(Roles = "Administrator")]
    public IActionResult GetPending() => Ok(_adminService.GetPendingRequests());

    [HttpPost("requests/{id}/approve")]
    public IActionResult ApproveRegistration(string id, [FromQuery] Role role = Role.Patient)
    {
        return _adminService.ApproveRegistration(id, role)
            ? Ok("Registration approved")
            : BadRequest("Failed to approve registration");
    }

    [HttpPost("requests/{id}/reject")]
    public IActionResult RejectRegistration(string id)
    {
        return _adminService.RejectRegistration(id)
            ? Ok("Registration rejected")
            : BadRequest("Failed to reject registration");
    }

    // -------------------- System Statistics --------------------
    [HttpGet("statistics")]
    public IActionResult GetStatistics([FromQuery] DateTime start, [FromQuery] DateTime end)
    {
        var stats = _adminService.GetSystemStatistics(start, end);
        return Ok(new
        {
            stats.totalUsers,
            stats.totalVisits,
            stats.totalPayments,
            stats.totalRevenue
        });
    }

    [HttpGet("patients")]
    public IActionResult GetPatients()
    {
        return Ok(_adminService.GetAllPatients());
    }

    [HttpGet("specialists")]
    public IActionResult GetSpecialists()
    {
        return Ok(_adminService.GetAllSpecialists());
    }

    // ==================== RAW MONGO QUERIES ====================
    [HttpPost("mongo/run")]
    public async Task<IActionResult> RunRawMongoQuery([FromBody] RawMongoQueryRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.CollectionName))
            return BadRequest("CollectionName is required.");
        if (string.IsNullOrWhiteSpace(request.Operation))
            return BadRequest("Operation is required.");

        try
        {
            switch (request.Operation.ToLower())
            {
                case "find":
                    var findResult = await _repo.ExecuteRawQueryAsync(request.CollectionName, request.Filter ?? new BsonDocument());
                    return Ok(findResult);

                case "insert":
                    if (request.Document == null) return BadRequest("Document is required for insert.");
                    var insertResult = await _repo.InsertDocumentAsync(request.CollectionName, request.Document);
                    return Ok(insertResult);

                case "update":
                    if (request.Filter == null || request.Document == null)
                        return BadRequest("Filter and Document are required for update.");
                    var updateResult = await _repo.UpdateDocumentsAsync(request.CollectionName, request.Filter, request.Document);
                    return Ok(new { MatchedCount = updateResult.MatchedCount, ModifiedCount = updateResult.ModifiedCount });

                case "delete":
                    if (request.Filter == null) return BadRequest("Filter is required for delete.");
                    var deleteResult = await _repo.DeleteDocumentsAsync(request.CollectionName, request.Filter);
                    return Ok(new { DeletedCount = deleteResult.DeletedCount });

                default:
                    return BadRequest("Unsupported operation. Use: find, insert, update, delete.");
            }
        }
        catch (Exception ex)
        {
            return BadRequest(new { Error = ex.Message });
        }
    }
    
    [HttpGet("statistics/avg-patients")]
    public IActionResult GetAveragePatients(
        [FromQuery] string? specialistId = null,
        [FromQuery] string? specialty = null)
    {
        if (!string.IsNullOrWhiteSpace(specialistId) &&
            !ObjectId.TryParse(specialistId, out _))
        {
            return BadRequest("Invalid specialistId format.");
        }

        double avg = _adminService.GetAveragePatientsPerDay(specialistId, specialty);

        return Ok(new
        {
            SpecialistId = specialistId,
            Specialty = specialty,
            AveragePatientsPerDay = Math.Round(avg, 2)
        });
    }
    
    [HttpGet("statistics/revenue")]
    public IActionResult GetRevenueForSpecialist(
        [FromQuery] string specialistId,
        [FromQuery] DateTime start,
        [FromQuery] DateTime end)
    {
        var revenue = _specialistService.GetRevenueForSpecialist(specialistId, start, end);

        return Ok(new
        {
            specialistId,
            start,
            end,
            revenue
        });
    }
    
    [HttpPost("statistics/patient-medications")]
    public IActionResult GetPatientMedicationPayments([FromBody] PatientMedicationRequest request)
    {
        if (request == null)
            return BadRequest("Request body is missing");

        var total = _adminService.GetPatientMedicationPaymentsByPeriod(
            request.PatientMedicalRecord,
            request.Start,
            request.End
        );

        return Ok(new
        {
            request.PatientMedicalRecord,
            request.Start,
            request.End,
            TotalMedicationPayments = total
        });
    }
}