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

    public OperatorController(OperatorService operatorService, SpecialistService specialistService)
    {
        _operatorService = operatorService;
        _specialistService = specialistService;
    }

    // -------------------- Dashboard --------------------
    [HttpGet("dashboard")]
    public IActionResult Dashboard()
    {
        return Ok(new
        {
            Message = "Operator dashboard is active",
            Sections = new[] { "patients", "specialists", "visits", "payments", "queries" }
        });
    }

    // -------------------- Patients --------------------
    [HttpGet("patients")]
    public IActionResult GetPatients()
    {
        var users = _operatorService.GetAllUsers();
        var patients = users.Where(u => u.UserRole == Role.Patient)
                            .Select(PatientMapper.ToDto)
                            .ToList();

        return Ok(patients);
    }

    [HttpPost("patients")]
    public IActionResult CreatePatient([FromBody] CreateUserDto dto)
    {
        var user = new User(dto.UserName, dto.FullName, Role.Patient);

        user.Phone = dto.Phone;
        user.Address = dto.Address;
        user.MedicalRecordNumber = dto.MedicalRecordNumber;

        if (dto.DateOfBirth.HasValue)
            user.DateOfBirth = dto.DateOfBirth;

        var result = _operatorService.CreateUserByOperator(user, dto.Password);
        return result ? Ok("Patient created") : BadRequest("Failed to create");
    }


    [HttpPut("patients/{id}")]
    public IActionResult UpdatePatient(string id, [FromBody] UpdateUserDto dto)
    {
        var user = _operatorService.GetById(id);

        user.FullName = dto.FullName;
        user.Phone = dto.Phone;
        user.Address = dto.Address;

        if (dto.MedicalRecordNumber.HasValue)
            user.MedicalRecordNumber = dto.MedicalRecordNumber;

        if (dto.DateOfBirth.HasValue)
            user.DateOfBirth = dto.DateOfBirth;

        return _operatorService.UpdateUserByOperator(user)
            ? Ok("Patient updated")
            : BadRequest("Update failed");
    }

    [HttpDelete("patients/{id}")]
    public IActionResult DeletePatient(string id)
    {
        return _operatorService.DeleteUserByOperator(id)
            ? Ok("Patient deleted")
            : BadRequest("Delete failed");
    }

    // -------------------- Specialists --------------------
    [HttpGet("specialists")]
    public IActionResult GetSpecialists()
    {
        var specialists = _specialistService.GetAllSpecialists()
                                            .Select(SpecialistMapper.ToDto)
                                            .ToList();
        return Ok(specialists);
    }

    [HttpGet("specialists/group-by-specialty")]
    public IActionResult CountBySpecialty()
    {
        return Ok(_specialistService.GetAllDoctorsGroupedBySpecialty());
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

        return _operatorService.CreateUserByOperator(specialist, dto.Password)
            ? Ok("Specialist created")
            : BadRequest("Failed to create specialist");
    }

    [HttpPut("specialists/{id}")]
    public IActionResult UpdateSpecialist(string id, [FromBody] UpdateSpecialistDto dto)
    {
        var specialist = _operatorService.GetById(id);

        specialist.FullName = dto.FullName;
        specialist.Speciality = dto.Specialty;
        specialist.Phone = dto.Phone;
        specialist.Address = dto.Address;

        return _operatorService.UpdateUserByOperator(specialist)
            ? Ok("Specialist updated")
            : BadRequest("Update failed");
    }

    [HttpDelete("specialists/{id}")]
    public IActionResult DeleteSpecialist(string id)
    {
        return _operatorService.DeleteUserByOperator(id)
            ? Ok("Specialist deleted")
            : BadRequest("Delete failed");
    }

    [HttpGet("specialists/{id}")]
    public IActionResult GetSpecialistById(string id)
    {
        var specialist = _operatorService.GetById(id);

        return specialist.UserRole == Role.Specialist
            ? Ok(SpecialistMapper.ToDto(specialist))
            : NotFound("Specialist not found");
    }
    // -------------------- Visits --------------------
    [HttpGet("visits")]
    public IActionResult GetVisits()
    {
        var visits = _operatorService.GetAllVisitsByOperator();
        return Ok(visits.Select(VisitMapper.ToResponse));
    }

    [HttpPost("visits")]
    public IActionResult CreateVisit([FromBody] VisitRequestDto dto)
    {
        var visit = VisitMapper.ToVisit(dto, dto.PatientMedicalRecord, dto.SpecialistId);

        return _operatorService.CreateVisitByOperator(visit)
            ? Ok("Visit created")
            : BadRequest("Failed to create visit");
    }

    [HttpPut("visits/{id}")]
    public IActionResult UpdateVisit(string id, [FromBody] VisitUpdateDto dto)
    {
        var visit = _operatorService.GetVisitByIdByOperator(id);
        VisitMapper.ApplyUpdate(visit, dto);

        return _operatorService.UpdateVisitByOperator(id, visit)
            ? Ok("Visit updated")
            : BadRequest("Update failed");
    }

    [HttpDelete("visits/{id}")]
    public IActionResult DeleteVisit(string id)
    {
        return _operatorService.DeleteVisitByOperator(id)
            ? Ok("Visit deleted")
            : BadRequest("Delete failed");
    }

    // -------------------- Payments --------------------
    [HttpGet("payments")]
    public IActionResult GetPayments()
    {
        var payments = _operatorService.GetAllPaymentsByOperator()
                                       .Select(PaymentMapper.ToDto)
                                       .ToList();
        return Ok(payments);
    }

    [HttpPost("payments")]
    public IActionResult CreatePayment([FromBody] PaymentDto dto)
    {
        var payment = new Payment(dto.VisitId, dto.PatientMedicalRecord, dto.TotalAmount, 0);
        return _operatorService.CreatePaymentByOperator(payment)
            ? Ok("Payment created")
            : BadRequest("Failed to create payment");
    }

    [HttpDelete("payments/{id}")]
    public IActionResult DeletePayment(string id)
    {
        return _operatorService.DeletePaymentByOperator(id)
            ? Ok("Payment deleted")
            : BadRequest("Delete failed");
    }
    
    // -------------------- SQL Queries --------------------
    // [HttpPost("queries/run")]
    // public IActionResult RunRawQuery([FromBody] RawSqlRequestDto request)
    // {
    //     if (string.IsNullOrWhiteSpace(request.Sql))
    //         return BadRequest("Query cannot be empty.");
    //
    //     var result = _operatorService.ExecuteRawSql(request.Sql);
    //     return Ok(result);
    // }
}