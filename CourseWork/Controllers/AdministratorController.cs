using System.Security.Claims;
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
    private readonly LoggingService _log;

    public AdministratorController(
        AdministratorService adminService,
        MongoDBRepository repo,
        SpecialistService specialistService,
        LoggingService log)
    {
        _adminService = adminService;
        _repo = repo;
        _specialistService = specialistService;
        _log = log;
    }

    private void LogAction(string action, string details)
    {
        var userId = User?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "unknown";
        var username = User?.FindFirst(ClaimTypes.Name)?.Value ?? "unknown";
        var role = User?.FindFirst(ClaimTypes.Role)?.Value ?? "unknown";

        _log.Log(
            userId,
            username,
            $"{action} (Role={role})",
            details
        );
    }

    // -------------------- Dashboard --------------------
    [HttpGet("dashboard")]
    public IActionResult Dashboard()
    {
        LogAction("Dashboard", "Administrator opened dashboard");

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
        LogAction("GetAdmins", "Requested list of all administrators");

        var admins = _adminService.GetAllAdmins()
            .Select(UserMapper.ToDto)
            .ToList();

        return Ok(admins);
    }

    [HttpGet("users")]
    public IActionResult GetUsers()
    {
        LogAction("GetUsers", "Requested list of all users");

        var users = _adminService.GetAllUsers()
            .ToList();

        return Ok(users);
    }

    [HttpDelete("users/{id}")]
    public IActionResult DeleteUser(string id)
    {
        LogAction("DeleteUser", $"Attempt to delete user with ID={id}");

        var result = _adminService.DeleteUserById(id);

        if (result)
        {
            LogAction("DeleteUserSuccess", $"User with ID={id} was deleted successfully");
            return Ok("User deleted successfully");
        }
        else
        {
            LogAction("DeleteUserFailed", $"Failed to delete user with ID={id}");
            return BadRequest("Failed to delete user");
        }
    }

    // -------------------- CREATE USER --------------------
    [HttpPost("users")]
    public IActionResult CreateUser([FromBody] User dto)
    {
        LogAction("CreateUserAttempt", $"UserName={dto?.UserName}, Role={dto?.UserRole}");

        if (dto == null || string.IsNullOrWhiteSpace(dto.PasswordHash) || string.IsNullOrWhiteSpace(dto.UserName))
        {
            LogAction("CreateUserFailed", "Invalid user data");
            return BadRequest("Invalid user data");
        }

        var user = new User(dto.UserName, string.Empty, dto.UserRole)
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
                {
                    LogAction("CreateUserFailed", "MedicalRecordNumber required for Patient");
                    return BadRequest("MedicalRecordNumber is required for Patient");
                }

                user.SetPatientInfo(dto.MedicalRecordNumber.Value, dto.DateOfBirth);
                break;

            case Role.Specialist:
                if (string.IsNullOrWhiteSpace(dto.Speciality))
                {
                    LogAction("CreateUserFailed", "Speciality required for Specialist");
                    return BadRequest("Speciality is required for Specialist");
                }

                user.SetSpecialistInfo(dto.Speciality, dto.DateOfBirth);
                break;
        }

        user.SetPasswordHash(dto.PasswordHash, _hasher);

        var result = _adminService.CreateUser(user, dto.PasswordHash);

        if (result)
        {
            LogAction("CreateUserSuccess", $"Created user with ID={user.Id}, Role={user.UserRole}");
            return Ok(UserMapper.ToDto(user));
        }
        else
        {
            LogAction("CreateUserFailed", "Database insert error");
            return BadRequest("Failed to create user");
        }
    }


// -------------------- UPDATE USER --------------------
    [HttpPut("users/{id}")]
    public IActionResult UpdateUser(string id, [FromBody] UpdateUserDtoAdmin dto)
    {
        LogAction("UpdateUserAttempt", $"UserId={id}");

        var user = _adminService.GetById(id);
        if (user == null)
        {
            LogAction("UpdateUserFailed", $"UserId={id} not found");
            return NotFound("User not found");
        }

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
        {
            LogAction("UpdateUserRoleChange", $"UserId={id}, OldRole={user.UserRole}, NewRole={dto.UserRole}");
            user.SetUserRole(dto.UserRole);
        }

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

        if (result)
        {
            LogAction("UpdateUserSuccess", $"UserId={id} updated successfully");
            return Ok(UserMapper.ToDto(user));
        }
        else
        {
            LogAction("UpdateUserFailed", $"Database error while updating UserId={id}");
            return BadRequest("Failed to update user");
        }
    }


    // -------------------- Visits Management --------------------
    [HttpGet("visits")]
    public IActionResult GetVisits()
    {
        LogAction("GetVisits", "Requested list of all visits");

        var visits = _adminService.GetAllVisits()
            .Select(VisitMapper.ToResponse)
            .ToList();

        return Ok(visits);
    }

    [HttpGet("visits/{id}")]
    public IActionResult GetVisitById(string id)
    {
        LogAction("GetVisitById", $"VisitId={id}");

        var visit = _adminService.GetVisitById(id);

        if (visit != null)
        {
            LogAction("GetVisitByIdSuccess", $"VisitId={id} found");
            return Ok(VisitMapper.ToResponse(visit));
        }
        else
        {
            LogAction("GetVisitByIdFailed", $"VisitId={id} NOT found");
            return NotFound("Visit not found");
        }
    }

    [HttpPost("visits")]
    public IActionResult CreateVisit([FromBody] VisitRequestDto dto)
    {
        LogAction("CreateVisitAttempt",
            $"PatientMR={dto?.PatientMedicalRecord}, SpecialistId={dto?.SpecialistId}, Date={dto?.VisitDate}");

        var visit = VisitMapper.ToVisit(dto, dto.PatientMedicalRecord, dto.SpecialistId);

        var result = _adminService.CreateVisit(visit);

        if (result)
        {
            LogAction("CreateVisitSuccess", $"Visit created for PatientMR={dto.PatientMedicalRecord}");
            return Ok("Visit created successfully");
        }
        else
        {
            LogAction("CreateVisitFailed", $"Failed to create visit for PatientMR={dto.PatientMedicalRecord}");
            return BadRequest("Failed to create visit");
        }
    }

    [HttpPut("visits/{id}")]
    public IActionResult UpdateVisit(string id, [FromBody] VisitUpdateDto dto)
    {
        LogAction("UpdateVisitAttempt", $"VisitId={id}");

        var visit = _adminService.GetVisitById(id);
        if (visit == null)
        {
            LogAction("UpdateVisitFailed", $"VisitId={id} NOT found");
            return NotFound("Visit not found");
        }

        VisitMapper.ApplyUpdate(visit, dto);

        var result = _adminService.UpdateVisit(id, visit);

        if (result)
        {
            LogAction("UpdateVisitSuccess", $"VisitId={id} updated");
            return Ok("Visit updated successfully");
        }
        else
        {
            LogAction("UpdateVisitFailed", $"Database error updating VisitId={id}");
            return BadRequest("Failed to update visit");
        }
    }

    [HttpDelete("visits/{id}")]
    public IActionResult DeleteVisit(string id)
    {
        LogAction("DeleteVisitAttempt", $"VisitId={id}");

        var result = _adminService.DeleteVisit(id);

        if (result)
        {
            LogAction("DeleteVisitSuccess", $"VisitId={id} deleted");
            return Ok("Visit deleted successfully");
        }
        else
        {
            LogAction("DeleteVisitFailed", $"Failed to delete VisitId={id}");
            return BadRequest("Failed to delete visit");
        }
    }

    [HttpGet("visits/total-cost")]
    public IActionResult GetTotalVisitCost([FromQuery] int recordNumber, [FromQuery] int year)
    {
        LogAction("GetTotalVisitCost",
            $"RecordNumber={recordNumber}, Year={year}");

        var total = _adminService.GetTotalVisitCostByYear(recordNumber, year);

        LogAction("GetTotalVisitCostResult",
            $"RecordNumber={recordNumber}, Year={year}, TotalCost={total}");

        return Ok(new { RecordNumber = recordNumber, Year = year, TotalCost = total });
    }

    // -------------------- Payments Management --------------------
    [HttpGet("payments")]
    public IActionResult GetPayments()
    {
        LogAction("GetPayments", "Fetching all payments");

        var payments = _adminService.GetAllPayments()
            .Select(PaymentMapper.ToDto)
            .ToList();

        LogAction("GetPaymentsResult", $"Count={payments.Count}");

        return Ok(payments);
    }

    [HttpGet("payments/{id}")]
    public IActionResult GetPaymentById(string id)
    {
        LogAction("GetPaymentById", $"Id={id}");

        var payment = _adminService.GetPaymentById(id);

        if (payment == null)
        {
            LogAction("GetPaymentByIdNotFound", $"Id={id}");
            return NotFound("Payment not found");
        }

        LogAction("GetPaymentByIdResult", $"Id={id} Found=true");

        return Ok(PaymentMapper.ToResponseDto(payment));
    }

    [HttpPost("payments")]
    public IActionResult CreatePayment([FromBody] PaymentCreateDto dto)
    {
        LogAction("CreatePayment",
            $"Record={dto.PatientMedicalRecord}, TotalAmount={dto.Amount}");

        var payment = PaymentMapper.ToPayment(dto, dto.PatientMedicalRecord);

        var result = _adminService.CreatePayment(payment);

        LogAction("CreatePaymentResult",
            $"Record={dto.PatientMedicalRecord}, Success={result}");

        return result ? Ok("Payment created") : BadRequest("Failed to create payment");
    }

    [HttpPut("payments/{id}")]
    public IActionResult UpdatePayment(string id, [FromBody] PaymentUpdateDto dto)
    {
        LogAction("UpdatePayment", $"Id={id}");

        var existingPayment = _adminService.GetPaymentById(id);
        if (existingPayment == null)
        {
            LogAction("UpdatePaymentNotFound", $"Id={id}");
            return NotFound("Payment not found");
        }

        existingPayment.TotalAmount = dto.TotalAmount;
        existingPayment.PaidAmount = dto.PaidAmount;
        existingPayment.RemainingAmount = dto.RemainingAmount;
        existingPayment.IssuedDate = dto.IssuedDate;
        existingPayment.DueDate = dto.DueDate;
        existingPayment.LastPaymentDate = dto.LastPaymentDate;

        if (!Enum.TryParse<PaymentStatus>(dto.Status, true, out var status))
        {
            LogAction("UpdatePaymentInvalidStatus", $"Id={id}, Status={dto.Status}");
            return BadRequest("Invalid payment status value");
        }

        existingPayment.Status = status;

        var result = _adminService.UpdatePayment(id, existingPayment);

        LogAction("UpdatePaymentResult", $"Id={id}, Success={result}");

        return result ? Ok("Payment updated") : BadRequest("Failed to update payment");
    }

    [HttpDelete("payments/{id}")]
    public IActionResult DeletePayment(string id)
    {
        LogAction("DeletePayment", $"Id={id}");

        var result = _adminService.DeletePayment(id);

        LogAction("DeletePaymentResult", $"Id={id}, Success={result}");

        return result ? Ok("Payment deleted") : BadRequest("Delete failed");
    }

    [HttpGet("payments/revenue")]
    public IActionResult GetRevenueByPeriod([FromQuery] DateTime start, [FromQuery] DateTime end)
    {
        LogAction("GetRevenueByPeriod",
            $"Start={start:yyyy-MM-dd}, End={end:yyyy-MM-dd}");

        var revenue = _adminService.GetClinicRevenueByPeriod(start, end);

        LogAction("GetRevenueByPeriodResult",
            $"Start={start:yyyy-MM-dd}, End={end:yyyy-MM-dd}, Revenue={revenue}");

        return Ok(new
        {
            StartDate = start,
            EndDate = end,
            TotalRevenue = revenue
        });
    }

    // -------------------- Registration Requests --------------------
    [HttpGet("pending")]
    [Authorize(Roles = "Administrator")]
    public IActionResult GetPending()
    {
        LogAction("GetPending", "Fetching pending registration requests");

        var result = _adminService.GetPendingRequests();

        LogAction("GetPendingResult", $"Count={result.Count()}");

        return Ok(result);
    }

    [HttpPost("requests/{id}/approve")]
    public IActionResult ApproveRegistration(string id, [FromQuery] Role role = Role.Patient)
    {
        LogAction("ApproveRegistration", $"Id={id}, Role={role}");

        var success = _adminService.ApproveRegistration(id, role);

        LogAction("ApproveRegistrationResult", $"Id={id}, Success={success}");

        return success ? Ok("Registration approved") : BadRequest("Failed to approve registration");
    }

    [HttpPost("requests/{id}/reject")]
    public IActionResult RejectRegistration(string id)
    {
        LogAction("RejectRegistration", $"Id={id}");

        var success = _adminService.RejectRegistration(id);

        LogAction("RejectRegistrationResult", $"Id={id}, Success={success}");

        return success ? Ok("Registration rejected") : BadRequest("Failed to reject registration");
    }

// -------------------- System Statistics --------------------
    [HttpGet("statistics")]
    public IActionResult GetStatistics([FromQuery] DateTime start, [FromQuery] DateTime end)
    {
        LogAction("GetStatistics", $"Start={start:yyyy-MM-dd}, End={end:yyyy-MM-dd}");

        var stats = _adminService.GetSystemStatistics(start, end);

        LogAction("GetStatisticsResult",
            $"Users={stats.totalUsers}, Visits={stats.totalVisits}, Payments={stats.totalPayments}, Revenue={stats.totalRevenue}");

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
        LogAction("GetPatients", "Fetching all patients");

        var result = _adminService.GetAllPatients();

        LogAction("GetPatientsResult", $"Count={result.Count()}");

        return Ok(result);
    }

    [HttpGet("specialists")]
    public IActionResult GetSpecialists()
    {
        LogAction("GetSpecialists", "Fetching all specialists");

        var result = _adminService.GetAllSpecialists();

        LogAction("GetSpecialistsResult", $"Count={result.Count()}");

        return Ok(result);
    }

// ==================== RAW MONGO QUERIES ====================
    [HttpPost("mongo/run")]
    public async Task<IActionResult> RunRawMongoQuery([FromBody] RawMongoQueryRequestDto request)
    {
        LogAction("RunRawMongoQuery", $"Collection={request.CollectionName}, Operation={request.Operation}");

        if (string.IsNullOrWhiteSpace(request.CollectionName))
            return BadRequest("CollectionName is required.");
        if (string.IsNullOrWhiteSpace(request.Operation))
            return BadRequest("Operation is required.");

        try
        {
            switch (request.Operation.ToLower())
            {
                case "find":
                    var findResult = await _repo.ExecuteRawQueryAsync(request.CollectionName,
                        request.Filter ?? new BsonDocument());

                    LogAction("RunRawMongoQueryFindResult", $"Count={findResult.Count()}");

                    return Ok(findResult);

                case "insert":
                    if (request.Document == null) return BadRequest("Document is required for insert.");

                    var insertResult = await _repo.InsertDocumentAsync(request.CollectionName, request.Document);

                    LogAction("RunRawMongoQueryInsertResult", "Insert successful");

                    return Ok(insertResult);

                case "update":
                    if (request.Filter == null || request.Document == null)
                        return BadRequest("Filter and Document are required for update.");

                    var updateResult =
                        await _repo.UpdateDocumentsAsync(request.CollectionName, request.Filter, request.Document);

                    LogAction("RunRawMongoQueryUpdateResult",
                        $"Matched={updateResult.MatchedCount}, Modified={updateResult.ModifiedCount}");

                    return Ok(new
                        { MatchedCount = updateResult.MatchedCount, ModifiedCount = updateResult.ModifiedCount });

                case "delete":
                    if (request.Filter == null) return BadRequest("Filter is required for delete.");

                    var deleteResult = await _repo.DeleteDocumentsAsync(request.CollectionName, request.Filter);

                    LogAction("RunRawMongoQueryDeleteResult", $"Deleted={deleteResult.DeletedCount}");

                    return Ok(new { DeletedCount = deleteResult.DeletedCount });

                default:
                    return BadRequest("Unsupported operation. Use: find, insert, update, delete.");
            }
        }
        catch (Exception ex)
        {
            LogAction("RunRawMongoQueryError", ex.Message);
            return BadRequest(new { Error = ex.Message });
        }
    }

    [HttpGet("statistics/avg-patients")]
    public IActionResult GetAveragePatients(
        [FromQuery] string? specialistId = null,
        [FromQuery] string? specialty = null)
    {
        LogAction("GetAveragePatients",
            $"SpecialistId={specialistId}, Specialty={specialty}");

        if (!string.IsNullOrWhiteSpace(specialistId) &&
            !ObjectId.TryParse(specialistId, out _))
        {
            LogAction("GetAveragePatientsError", $"InvalidId={specialistId}");
            return BadRequest("Invalid specialistId format.");
        }

        double avg = _adminService.GetAveragePatientsPerDay(specialistId, specialty);

        LogAction("GetAveragePatientsResult", $"Avg={avg}");

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
        LogAction("GetRevenueForSpecialist",
            $"SpecialistId={specialistId}, Start={start}, End={end}");

        var revenue = _specialistService.GetRevenueForSpecialist(specialistId, start, end);

        LogAction("GetRevenueForSpecialistResult", $"Revenue={revenue}");

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
        LogAction("GetPatientMedicationPayments",
            $"Record={request?.PatientMedicalRecord}");

        if (request == null)
        {
            LogAction("GetPatientMedicationPaymentsError", "Empty request body");
            return BadRequest("Request body is missing");
        }

        var total = _adminService.GetPatientMedicationPaymentsByPeriod(
            request.PatientMedicalRecord,
            request.Start,
            request.End
        );

        LogAction("GetPatientMedicationPaymentsResult", $"Total={total}");

        return Ok(new
        {
            request.PatientMedicalRecord,
            request.Start,
            request.End,
            TotalMedicationPayments = total
        });
    }

    [HttpGet("statistics/patient-total-cost")]
    public IActionResult GetPatientTotalCost(
        [FromQuery] int patientRecord,
        [FromQuery] int year)
    {
        LogAction("GetPatientTotalCost", $"Record={patientRecord}, Year={year}");

        if (patientRecord <= 0 || year < 2000 || year > 2100)
        {
            LogAction("GetPatientTotalCostError", "Invalid input");
            return BadRequest("Invalid patient record or year");
        }

        var monthlyCosts = new decimal[12]; // Jan - Dec
        decimal totalCost = _adminService.GetPatientTotalCostByYear(patientRecord, year, ref monthlyCosts);

        LogAction("GetPatientTotalCostResult", $"Total={totalCost}");

        return Ok(new
        {
            patientMedicalRecord = patientRecord,
            year,
            totalCost,
            monthlyCosts
        });
    }

    [HttpGet("statistics/patients-by-profile")]
    public IActionResult GetPatientsBySpecialistProfile([FromQuery] string specialty)
    {
        LogAction("GetPatientsBySpecialistProfile", $"Specialty={specialty}");

        if (string.IsNullOrWhiteSpace(specialty))
        {
            LogAction("GetPatientsBySpecialistProfileError", "Specialty empty");
            return BadRequest("Specialty is required.");
        }

        var patients = _adminService.GetPatientsBySpecialistProfile(specialty);

        LogAction("GetPatientsBySpecialistProfileResult",
            $"Count={patients.Count()}");

        return Ok(patients);
    }
    
    // -------------------- Audit Logs --------------------
    [HttpGet("logs")]
    public IActionResult GetAllLogs()
    {
        LogAction("GetAllLogs", "Fetching all audit logs");

        var logs = _log.GetAllLogs();

        LogAction("GetAllLogsResult", $"Count={logs.Count}");

        return Ok(logs);
    }
}