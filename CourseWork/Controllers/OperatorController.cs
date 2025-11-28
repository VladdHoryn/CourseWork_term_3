using System.Security.Claims;
using CourseWork.DTOs;
using CourseWork.Mappers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Сoursework.Models;
using Сoursework.Services;

namespace CourseWork.Controllers;

[Authorize(Roles = "Operator")]
[ApiController]
[Route("operator")]
public class OperatorController : ControllerBase
{
    private readonly OperatorService _operatorService;
    private readonly SpecialistService _specialistService;
    private readonly LoggingService _log;

    public OperatorController(
        OperatorService operatorService, 
        SpecialistService specialistService,
        LoggingService log)
    {
        _operatorService = operatorService;
        _specialistService = specialistService;
        _log = log;
    }
    
    private void LogAction(string action, string details)
    {
        var userId = User?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "unknown";
        var username = User?.FindFirst(ClaimTypes.Name)?.Value ?? "unknown";
        var role = User?.FindFirst(ClaimTypes.Role)?.Value ?? "unknown";

        _log.Log(userId, username, $"{action} (Role={role})", details);
    }

     // -------------------- Dashboard --------------------
    [HttpGet("dashboard")]
    public IActionResult Dashboard()
    {
        LogAction("Dashboard", "Operator opened dashboard");

        return Ok(new
        {
            Message = "Operator dashboard is active",
            Sections = new[] { "patients", "specialists", "visits", "payments", "queries", "logs" }
        });
    }

    // -------------------- Patients --------------------
    [HttpGet("patients")]
    public IActionResult GetPatients()
    {
        LogAction("GetPatients", "Operator requested all patients");

        var users = _operatorService.GetAllUsers();
        var patients = users.Where(u => u.UserRole == Role.Patient)
                            .Select(PatientMapper.ToDto)
                            .ToList();

        return Ok(patients);
    }

    [HttpPost("patients")]
    public IActionResult CreatePatient([FromBody] CreateUserDto dto)
    {
        var user = new User(dto.UserName, dto.FullName, Role.Patient)
        {
            Phone = dto.Phone,
            Address = dto.Address,
            MedicalRecordNumber = dto.MedicalRecordNumber,
            DateOfBirth = dto.DateOfBirth
        };

        var result = _operatorService.CreateUserByOperator(user, dto.Password);

        LogAction("CreatePatient", result ? $"Created patient {dto.UserName}" : $"Failed to create patient {dto.UserName}");

        return result ? Ok("Patient created") : BadRequest("Failed to create");
    }

    [HttpPut("patients/{id}")]
    public IActionResult UpdatePatient(string id, [FromBody] UpdateUserDto dto)
    {
        var user = _operatorService.GetById(id);
        if (user == null) return NotFound("Patient not found");

        user.FullName = dto.FullName;
        user.Phone = dto.Phone;
        user.Address = dto.Address;
        if (dto.MedicalRecordNumber.HasValue)
            user.MedicalRecordNumber = dto.MedicalRecordNumber;
        if (dto.DateOfBirth.HasValue)
            user.DateOfBirth = dto.DateOfBirth;

        var result = _operatorService.UpdateUserByOperator(user);

        LogAction("UpdatePatient", result ? $"Updated patient {user.UserName}" : $"Failed to update patient {user.UserName}");

        return result ? Ok("Patient updated") : BadRequest("Update failed");
    }

    [HttpDelete("patients/{id}")]
    public IActionResult DeletePatient(string id)
    {
        var result = _operatorService.DeleteUserByOperator(id);

        LogAction("DeletePatient", result ? $"Deleted patient {id}" : $"Failed to delete patient {id}");

        return result ? Ok("Patient deleted") : BadRequest("Delete failed");
    }

    // -------------------- Specialists --------------------
    [HttpGet("specialists")]
    public IActionResult GetSpecialists()
    {
        LogAction("GetSpecialists", "Operator requested all specialists");

        var specialists = _specialistService.GetAllSpecialists()
                                            .ToList();
        return Ok(specialists);
    }

    [HttpPost("specialists")]
    public IActionResult CreateSpecialist([FromBody] CreateSpecialistDto dto)
    {
        var specialist = new User(dto.UserName, dto.FullName, Role.Specialist)
        {
            Phone = dto.Phone,
            Address = dto.Address,
            Speciality = dto.Specialty
        };

        var result = _operatorService.CreateUserByOperator(specialist, dto.Password);

        LogAction("CreateSpecialist", result ? $"Created specialist {dto.UserName}" : $"Failed to create specialist {dto.UserName}");

        return result ? Ok("Specialist created") : BadRequest("Failed to create specialist");
    }

    [HttpPut("specialists/{id}")]
    public IActionResult UpdateSpecialist(string id, [FromBody] UpdateSpecialistDto dto)
    {
        var specialist = _operatorService.GetById(id);
        if (specialist == null) return NotFound("Specialist not found");

        specialist.FullName = dto.FullName;
        specialist.Speciality = dto.Specialty;
        specialist.Phone = dto.Phone;
        specialist.Address = dto.Address;

        var result = _operatorService.UpdateUserByOperator(specialist);

        LogAction("UpdateSpecialist", result ? $"Updated specialist {specialist.UserName}" : $"Failed to update specialist {specialist.UserName}");

        return result ? Ok("Specialist updated") : BadRequest("Update failed");
    }

    [HttpDelete("specialists/{id}")]
    public IActionResult DeleteSpecialist(string id)
    {
        var result = _operatorService.DeleteUserByOperator(id);

        LogAction("DeleteSpecialist", result ? $"Deleted specialist {id}" : $"Failed to delete specialist {id}");

        return result ? Ok("Specialist deleted") : BadRequest("Delete failed");
    }

    // -------------------- Visits --------------------
    [HttpGet("visits")]
    public IActionResult GetVisits()
    {
        LogAction("GetVisits", "Operator requested all visits");

        var visits = _operatorService.GetAllVisitsByOperator();
        return Ok(visits.Select(VisitMapper.ToResponse));
    }

    [HttpPost("visits")]
    public IActionResult CreateVisit([FromBody] VisitRequestDto dto)
    {
        var visit = VisitMapper.ToVisit(dto, dto.PatientMedicalRecord, dto.SpecialistId);
        var result = _operatorService.CreateVisitByOperator(visit);

        LogAction("CreateVisit", result ? $"Created visit for MR {dto.PatientMedicalRecord}" : $"Failed to create visit for MR {dto.PatientMedicalRecord}");

        return result ? Ok("Visit created") : BadRequest("Failed to create visit");
    }

    [HttpPut("visits/{id}")]
    public IActionResult UpdateVisit(string id, [FromBody] VisitUpdateDto dto)
    {
        var visit = _operatorService.GetVisitByIdByOperator(id);
        if (visit == null) return NotFound("Visit not found");

        VisitMapper.ApplyUpdate(visit, dto);
        var result = _operatorService.UpdateVisitByOperator(id, visit);

        LogAction("UpdateVisit", result ? $"Updated visit {id}" : $"Failed to update visit {id}");

        return result ? Ok("Visit updated") : BadRequest("Update failed");
    }

    [HttpDelete("visits/{id}")]
    public IActionResult DeleteVisit(string id)
    {
        var result = _operatorService.DeleteVisitByOperator(id);

        LogAction("DeleteVisit", result ? $"Deleted visit {id}" : $"Failed to delete visit {id}");

        return result ? Ok("Visit deleted") : BadRequest("Delete failed");
    }

    // -------------------- Payments --------------------
    [HttpGet("payments")]
    public IActionResult GetPayments()
    {
        LogAction("GetPayments", "Operator requested all payments");

        var payments = _operatorService.GetAllPaymentsByOperator()
                                       .Select(PaymentMapper.ToDto)
                                       .ToList();
        return Ok(payments);
    }

    [HttpPost("payments")]
    public IActionResult CreatePayment([FromBody] PaymentCreateDto dto)
    {
        var payment = PaymentMapper.ToPayment(dto, dto.PatientMedicalRecord);
        var result = _operatorService.CreatePaymentByOperator(payment);

        LogAction("CreatePayment", result ? $"Created payment for MR {dto.PatientMedicalRecord}" : $"Failed to create payment for MR {dto.PatientMedicalRecord}");

        return result ? Ok("Payment created") : BadRequest("Failed to create payment");
    }

    [HttpPut("payments/{id}")]
    public IActionResult UpdatePayment(string id, [FromBody] PaymentUpdateDto dto)
    {
        var existingPayment = _operatorService.GetAllPaymentsByOperator()
            .FirstOrDefault(p => p.Id == id);

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

        var result = _operatorService.UpdatePaymentByOperator(id, existingPayment);

        LogAction("UpdatePayment", result ? $"Updated payment {id}" : $"Failed to update payment {id}");

        return result ? Ok("Payment updated") : BadRequest("Failed to update payment");
    }

    [HttpDelete("payments/{id}")]
    public IActionResult DeletePayment(string id)
    {
        var result = _operatorService.DeletePaymentByOperator(id);

        LogAction("DeletePayment", result ? $"Deleted payment {id}" : $"Failed to delete payment {id}");

        return result ? Ok("Payment deleted") : BadRequest("Delete failed");
    }
}