import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Staff, staffService, CreateStaffData } from '../services/staffService';
import api from '../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// SVG icons
const Icons = {
  Photo: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  Upload: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>,
  ArrowLeft: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>,
};

const EditStaffPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('personal');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [myDepartments, setMyDepartments] = useState<any[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  
  const [newStaff, setNewStaff] = useState<CreateStaffData>({
    name: '',
    photo_url: '',
    empl_no: '',
    id_no: 0,
    role: '',
    designation: '',
    employment_type: 'Consultant',
    gender: '',
    business_email: '',
    department_email: '',
    phone_number: '',
    salary: null,
    department: '',
    department_id: undefined,
  });

  // Additional form state
  const [managerId, setManagerId] = useState<number | ''>('');
  const [benefit1, setBenefit1] = useState<string>('');
  const [benefit2, setBenefit2] = useState<string>('');
  const [benefit3, setBenefit3] = useState<string>('');
  const [beneficiary1Name, setBeneficiary1Name] = useState<string>('');
  const [beneficiary1Relationship, setBeneficiary1Relationship] = useState<string>('');
  const [beneficiary1Contact, setBeneficiary1Contact] = useState<string>('');
  const [beneficiary2Name, setBeneficiary2Name] = useState<string>('');
  const [beneficiary2Relationship, setBeneficiary2Relationship] = useState<string>('');
  const [beneficiary2Contact, setBeneficiary2Contact] = useState<string>('');
  const [emergency1Name, setEmergency1Name] = useState<string>('');
  const [emergency1Relationship, setEmergency1Relationship] = useState<string>('');
  const [emergency1Contact, setEmergency1Contact] = useState<string>('');
  const [emergency2Name, setEmergency2Name] = useState<string>('');
  const [emergency2Relationship, setEmergency2Relationship] = useState<string>('');
  const [emergency2Contact, setEmergency2Contact] = useState<string>('');
  const [family1Name, setFamily1Name] = useState<string>('');
  const [family1Relationship, setFamily1Relationship] = useState<string>('');
  const [family1Contact, setFamily1Contact] = useState<string>('');
  const [family2Name, setFamily2Name] = useState<string>('');
  const [family2Relationship, setFamily2Relationship] = useState<string>('');
  const [family2Contact, setFamily2Contact] = useState<string>('');
  const [family3Name, setFamily3Name] = useState<string>('');
  const [family3Relationship, setFamily3Relationship] = useState<string>('');
  const [family3Contact, setFamily3Contact] = useState<string>('');
  const [education1Institution, setEducation1Institution] = useState<string>('');
  const [education1Year, setEducation1Year] = useState<string>('');
  const [education1Qualification, setEducation1Qualification] = useState<string>('');
  const [education2Institution, setEducation2Institution] = useState<string>('');
  const [education2Year, setEducation2Year] = useState<string>('');
  const [education2Qualification, setEducation2Qualification] = useState<string>('');
  const [education3Institution, setEducation3Institution] = useState<string>('');
  const [education3Year, setEducation3Year] = useState<string>('');
  const [education3Qualification, setEducation3Qualification] = useState<string>('');
  const [education4Institution, setEducation4Institution] = useState<string>('');
  const [education4Year, setEducation4Year] = useState<string>('');
  const [education4Qualification, setEducation4Qualification] = useState<string>('');
  const [education5Institution, setEducation5Institution] = useState<string>('');
  const [education5Year, setEducation5Year] = useState<string>('');
  const [education5Qualification, setEducation5Qualification] = useState<string>('');
  const [experience1Organization, setExperience1Organization] = useState<string>('');
  const [experience1From, setExperience1From] = useState<string>('');
  const [experience1To, setExperience1To] = useState<string>('');
  const [experience1Designation, setExperience1Designation] = useState<string>('');
  const [experience1Reason, setExperience1Reason] = useState<string>('');
  const [experience2Organization, setExperience2Organization] = useState<string>('');
  const [experience2From, setExperience2From] = useState<string>('');
  const [experience2To, setExperience2To] = useState<string>('');
  const [experience2Designation, setExperience2Designation] = useState<string>('');
  const [experience2Reason, setExperience2Reason] = useState<string>('');
  const [experience3Organization, setExperience3Organization] = useState<string>('');
  const [experience3From, setExperience3From] = useState<string>('');
  const [experience3To, setExperience3To] = useState<string>('');
  const [experience3Designation, setExperience3Designation] = useState<string>('');
  const [experience3Reason, setExperience3Reason] = useState<string>('');
  const [experience4Organization, setExperience4Organization] = useState<string>('');
  const [experience4From, setExperience4From] = useState<string>('');
  const [experience4To, setExperience4To] = useState<string>('');
  const [experience4Designation, setExperience4Designation] = useState<string>('');
  const [experience4Reason, setExperience4Reason] = useState<string>('');
  const [experience5Organization, setExperience5Organization] = useState<string>('');
  const [experience5From, setExperience5From] = useState<string>('');
  const [experience5To, setExperience5To] = useState<string>('');
  const [experience5Designation, setExperience5Designation] = useState<string>('');
  const [experience5Reason, setExperience5Reason] = useState<string>('');
  
  // References state
  const [ref1Name, setRef1Name] = useState<string>('');
  const [ref1Position, setRef1Position] = useState<string>('');
  const [ref1Company, setRef1Company] = useState<string>('');
  const [ref1Phone, setRef1Phone] = useState<string>('');
  const [ref1Email, setRef1Email] = useState<string>('');
  const [ref2Name, setRef2Name] = useState<string>('');
  const [ref2Position, setRef2Position] = useState<string>('');
  const [ref2Company, setRef2Company] = useState<string>('');
  const [ref2Phone, setRef2Phone] = useState<string>('');
  const [ref2Email, setRef2Email] = useState<string>('');
  
  // Additional staff table fields
  const [dateOfBirth, setDateOfBirth] = useState<string>('');
  const [maritalStatus, setMaritalStatus] = useState<string>('');
  const [nationality, setNationality] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [offerDate, setOfferDate] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [nhifNumber, setNhifNumber] = useState<string>('');
  const [nssfNumber, setNssfNumber] = useState<string>('');
  const [kraPin, setKraPin] = useState<string>('');
  const [passportNumber, setPassportNumber] = useState<string>('');
  const [bankName, setBankName] = useState<string>('');
  const [bankBranch, setBankBranch] = useState<string>('');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [accountName, setAccountName] = useState<string>('');
  const [swiftCode, setSwiftCode] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        if (!id) {
          setError('No staff ID provided');
          setIsLoading(false);
          return;
        }
        
        const [staffData, allStaffData, myDepartmentsData] = await Promise.all([
          staffService.getStaffById(parseInt(id)),
          staffService.getStaffList(),
          staffService.getDepartments()
        ]);
        
        // Set basic staff data
        setNewStaff({
          name: staffData.name,
          photo_url: staffData.photo_url,
          empl_no: staffData.empl_no,
          id_no: staffData.id_no,
          role: staffData.role,
          designation: staffData.designation || '',
          employment_type: staffData.employment_type || 'Consultant',
          gender: staffData.gender || '',
          business_email: staffData.business_email || '',
          department_email: staffData.department_email || '',
          phone_number: staffData.phone_number || '',
          salary: staffData.salary || null,
          department: staffData.department || '',
          department_id: staffData.department_id,
        });
        
        // Set extended fields
        setManagerId(staffData.manager_id || '');
        setDateOfBirth(staffData.date_of_birth || '');
        setMaritalStatus(staffData.marital_status || '');
        setNationality(staffData.nationality || '');
        setAddress(staffData.address || '');
        setOfferDate(staffData.offer_date || '');
        setStartDate(staffData.start_date || '');
        setNhifNumber(staffData.nhif_number || '');
        setNssfNumber(staffData.nssf_number || '');
        setKraPin(staffData.kra_pin || '');
        setPassportNumber(staffData.passport_number || '');
        setBankName(staffData.bank_name || '');
        setBankBranch(staffData.bank_branch || '');
        setAccountNumber(staffData.account_number || '');
        setAccountName(staffData.account_name || '');
        setSwiftCode(staffData.swift_code || '');
        
        // Set benefits
        if (staffData.benefits && Array.isArray(staffData.benefits)) {
          setBenefit1(staffData.benefits[0] || '');
          setBenefit2(staffData.benefits[1] || '');
          setBenefit3(staffData.benefits[2] || '');
        }
        
        // Set beneficiaries
        if (staffData.beneficiaries && Array.isArray(staffData.beneficiaries)) {
          if (staffData.beneficiaries[0]) {
            setBeneficiary1Name(staffData.beneficiaries[0].name || '');
            setBeneficiary1Relationship(staffData.beneficiaries[0].relationship || '');
            setBeneficiary1Contact(staffData.beneficiaries[0].contact || '');
          }
          if (staffData.beneficiaries[1]) {
            setBeneficiary2Name(staffData.beneficiaries[1].name || '');
            setBeneficiary2Relationship(staffData.beneficiaries[1].relationship || '');
            setBeneficiary2Contact(staffData.beneficiaries[1].contact || '');
          }
        }
        
        // Set emergency contacts
        if (staffData.emergency_contacts && Array.isArray(staffData.emergency_contacts)) {
          if (staffData.emergency_contacts[0]) {
            setEmergency1Name(staffData.emergency_contacts[0].name || '');
            setEmergency1Relationship(staffData.emergency_contacts[0].relationship || '');
            setEmergency1Contact(staffData.emergency_contacts[0].contact || '');
          }
          if (staffData.emergency_contacts[1]) {
            setEmergency2Name(staffData.emergency_contacts[1].name || '');
            setEmergency2Relationship(staffData.emergency_contacts[1].relationship || '');
            setEmergency2Contact(staffData.emergency_contacts[1].contact || '');
          }
        }
        
        // Set family
        if (staffData.family && Array.isArray(staffData.family)) {
          if (staffData.family[0]) {
            setFamily1Name(staffData.family[0].name || '');
            setFamily1Relationship(staffData.family[0].relationship || '');
            setFamily1Contact(staffData.family[0].contact || '');
          }
          if (staffData.family[1]) {
            setFamily2Name(staffData.family[1].name || '');
            setFamily2Relationship(staffData.family[1].relationship || '');
            setFamily2Contact(staffData.family[1].contact || '');
          }
          if (staffData.family[2]) {
            setFamily3Name(staffData.family[2].name || '');
            setFamily3Relationship(staffData.family[2].relationship || '');
            setFamily3Contact(staffData.family[2].contact || '');
          }
        }
        
        // Set education
        if (staffData.education && Array.isArray(staffData.education)) {
          if (staffData.education[0]) {
            setEducation1Institution(staffData.education[0].institution || '');
            setEducation1Qualification(staffData.education[0].qualification || '');
            setEducation1Year(staffData.education[0].year_of_completion || '');
          }
          if (staffData.education[1]) {
            setEducation2Institution(staffData.education[1].institution || '');
            setEducation2Qualification(staffData.education[1].qualification || '');
            setEducation2Year(staffData.education[1].year_of_completion || '');
          }
          if (staffData.education[2]) {
            setEducation3Institution(staffData.education[2].institution || '');
            setEducation3Qualification(staffData.education[2].qualification || '');
            setEducation3Year(staffData.education[2].year_of_completion || '');
          }
          if (staffData.education[3]) {
            setEducation4Institution(staffData.education[3].institution || '');
            setEducation4Qualification(staffData.education[3].qualification || '');
            setEducation4Year(staffData.education[3].year_of_completion || '');
          }
          if (staffData.education[4]) {
            setEducation5Institution(staffData.education[4].institution || '');
            setEducation5Qualification(staffData.education[4].qualification || '');
            setEducation5Year(staffData.education[4].year_of_completion || '');
          }
        }
        
        // Set work experience
        if (staffData.work_experience && Array.isArray(staffData.work_experience)) {
          if (staffData.work_experience[0]) {
            setExperience1Organization(staffData.work_experience[0].organization || '');
            setExperience1Designation(staffData.work_experience[0].designation || '');
            setExperience1From(staffData.work_experience[0].from_date || '');
            setExperience1To(staffData.work_experience[0].to_date || '');
            setExperience1Reason(staffData.work_experience[0].reason_for_leaving || '');
          }
          if (staffData.work_experience[1]) {
            setExperience2Organization(staffData.work_experience[1].organization || '');
            setExperience2Designation(staffData.work_experience[1].designation || '');
            setExperience2From(staffData.work_experience[1].from_date || '');
            setExperience2To(staffData.work_experience[1].to_date || '');
            setExperience2Reason(staffData.work_experience[1].reason_for_leaving || '');
          }
          if (staffData.work_experience[2]) {
            setExperience3Organization(staffData.work_experience[2].organization || '');
            setExperience3Designation(staffData.work_experience[2].designation || '');
            setExperience3From(staffData.work_experience[2].from_date || '');
            setExperience3To(staffData.work_experience[2].to_date || '');
            setExperience3Reason(staffData.work_experience[2].reason_for_leaving || '');
          }
          if (staffData.work_experience[3]) {
            setExperience4Organization(staffData.work_experience[3].organization || '');
            setExperience4Designation(staffData.work_experience[3].designation || '');
            setExperience4From(staffData.work_experience[3].from_date || '');
            setExperience4To(staffData.work_experience[3].to_date || '');
            setExperience4Reason(staffData.work_experience[3].reason_for_leaving || '');
          }
          if (staffData.work_experience[4]) {
            setExperience5Organization(staffData.work_experience[4].organization || '');
            setExperience5Designation(staffData.work_experience[4].designation || '');
            setExperience5From(staffData.work_experience[4].from_date || '');
            setExperience5To(staffData.work_experience[4].to_date || '');
            setExperience5Reason(staffData.work_experience[4].reason_for_leaving || '');
          }
        }
        
        // Set references
        if (staffData.references && Array.isArray(staffData.references)) {
          if (staffData.references[0]) {
            setRef1Name(staffData.references[0].name || '');
            setRef1Position(staffData.references[0].position || '');
            setRef1Company(staffData.references[0].company || '');
            setRef1Phone(staffData.references[0].phone || '');
            setRef1Email(staffData.references[0].email || '');
          }
          if (staffData.references[1]) {
            setRef2Name(staffData.references[1].name || '');
            setRef2Position(staffData.references[1].position || '');
            setRef2Company(staffData.references[1].company || '');
            setRef2Phone(staffData.references[1].phone || '');
            setRef2Email(staffData.references[1].email || '');
          }
        }
        
        setMyDepartments(myDepartmentsData);
        setStaff(allStaffData);
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load staff data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewStaff(prev => ({
      ...prev,
      [name]: name === 'id_no' ? parseInt(value) || 0 : 
              name === 'salary' ? parseFloat(value) || null : value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    
    try {
      setIsUploading(true);
      let photoUrl = newStaff.photo_url;

      if (selectedFile) {
        photoUrl = await staffService.uploadPhoto(selectedFile);
      }

      // Prepare benefits array
      const benefitsArray = [];
      if (benefit1) benefitsArray.push(benefit1);
      if (benefit2) benefitsArray.push(benefit2);
      if (benefit3) benefitsArray.push(benefit3);

      // Prepare beneficiaries array
      const beneficiariesArray = [];
      if (beneficiary1Name && beneficiary1Relationship && beneficiary1Contact) {
        beneficiariesArray.push({
          name: beneficiary1Name,
          relationship: beneficiary1Relationship,
          contact: beneficiary1Contact,
          entry_order: 1
        });
      }
      if (beneficiary2Name && beneficiary2Relationship && beneficiary2Contact) {
        beneficiariesArray.push({
          name: beneficiary2Name,
          relationship: beneficiary2Relationship,
          contact: beneficiary2Contact,
          entry_order: 2
        });
      }

      // Prepare emergency contacts array
      const emergencyContactsArray = [];
      if (emergency1Name && emergency1Relationship && emergency1Contact) {
        emergencyContactsArray.push({
          name: emergency1Name,
          relationship: emergency1Relationship,
          contact: emergency1Contact,
          entry_order: 1
        });
      }
      if (emergency2Name && emergency2Relationship && emergency2Contact) {
        emergencyContactsArray.push({
          name: emergency2Name,
          relationship: emergency2Relationship,
          contact: emergency2Contact,
          entry_order: 2
        });
      }

      // Prepare family array
      const familyArray = [];
      if (family1Name && family1Relationship && family1Contact) {
        familyArray.push({
          name: family1Name,
          relationship: family1Relationship,
          contact: family1Contact,
          entry_order: 1
        });
      }
      if (family2Name && family2Relationship && family2Contact) {
        familyArray.push({
          name: family2Name,
          relationship: family2Relationship,
          contact: family2Contact,
          entry_order: 2
        });
      }
      if (family3Name && family3Relationship && family3Contact) {
        familyArray.push({
          name: family3Name,
          relationship: family3Relationship,
          contact: family3Contact,
          entry_order: 3
        });
      }

      // Prepare education array
      const educationArray = [];
      if (education1Institution && education1Qualification) {
        educationArray.push({
          institution: education1Institution,
          qualification: education1Qualification,
          year_of_completion: education1Year,
          entry_order: 1
        });
      }
      if (education2Institution && education2Qualification) {
        educationArray.push({
          institution: education2Institution,
          qualification: education2Qualification,
          year_of_completion: education2Year,
          entry_order: 2
        });
      }
      if (education3Institution && education3Qualification) {
        educationArray.push({
          institution: education3Institution,
          qualification: education3Qualification,
          year_of_completion: education3Year,
          entry_order: 3
        });
      }
      if (education4Institution && education4Qualification) {
        educationArray.push({
          institution: education4Institution,
          qualification: education4Qualification,
          year_of_completion: education4Year,
          entry_order: 4
        });
      }
      if (education5Institution && education5Qualification) {
        educationArray.push({
          institution: education5Institution,
          qualification: education5Qualification,
          year_of_completion: education5Year,
          entry_order: 5
        });
      }

      // Prepare work experience array
      const workExperienceArray = [];
      if (experience1Organization && experience1Designation) {
        workExperienceArray.push({
          organization: experience1Organization,
          designation: experience1Designation,
          from_date: experience1From || null,
          to_date: experience1To || null,
          reason_for_leaving: experience1Reason || null,
          entry_order: 1
        });
      }
      if (experience2Organization && experience2Designation) {
        workExperienceArray.push({
          organization: experience2Organization,
          designation: experience2Designation,
          from_date: experience2From || null,
          to_date: experience2To || null,
          reason_for_leaving: experience2Reason || null,
          entry_order: 2
        });
      }
      if (experience3Organization && experience3Designation) {
        workExperienceArray.push({
          organization: experience3Organization,
          designation: experience3Designation,
          from_date: experience3From || null,
          to_date: experience3To || null,
          reason_for_leaving: experience3Reason || null,
          entry_order: 3
        });
      }
      if (experience4Organization && experience4Designation) {
        workExperienceArray.push({
          organization: experience4Organization,
          designation: experience4Designation,
          from_date: experience4From || null,
          to_date: experience4To || null,
          reason_for_leaving: experience4Reason || null,
          entry_order: 4
        });
      }
      if (experience5Organization && experience5Designation) {
        workExperienceArray.push({
          organization: experience5Organization,
          designation: experience5Designation,
          from_date: experience5From || null,
          to_date: experience5To || null,
          reason_for_leaving: experience5Reason || null,
          entry_order: 5
        });
      }

      // Prepare references array
      const referencesArray = [];
      if (ref1Name) {
        referencesArray.push({
          name: ref1Name,
          position: ref1Position || null,
          company: ref1Company || null,
          phone: ref1Phone || null,
          email: ref1Email || null,
          entry_order: 1
        });
      }
      if (ref2Name) {
        referencesArray.push({
          name: ref2Name,
          position: ref2Position || null,
          company: ref2Company || null,
          phone: ref2Phone || null,
          email: ref2Email || null,
          entry_order: 2
        });
      }

      const updateData = {
        ...newStaff,
        photo_url: photoUrl,
        manager_id: managerId || null,
        offer_date: offerDate || null,
        start_date: startDate || null,
        date_of_birth: dateOfBirth || null,
        marital_status: maritalStatus || null,
        nationality: nationality || null,
        address: address || null,
        nhif_number: nhifNumber || null,
        nssf_number: nssfNumber || null,
        kra_pin: kraPin || null,
        passport_number: passportNumber || null,
        bank_name: bankName || null,
        bank_branch: bankBranch || null,
        account_number: accountNumber || null,
        account_name: accountName || null,
        swift_code: swiftCode || null,
        benefits: benefitsArray.length > 0 ? benefitsArray : null,
        beneficiaries: beneficiariesArray,
        emergency_contacts: emergencyContactsArray,
        family: familyArray,
        education: educationArray,
        work_experience: workExperienceArray,
        references: referencesArray
      };
      
      console.log('Sending update data:', JSON.stringify(updateData, null, 2));
      
      await staffService.updateStaff(parseInt(id), updateData);

      // Show success message
      setSuccess('Staff member updated successfully!');
      setError(null);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
      
      // Reload the staff data to reflect changes
      const updatedStaffData = await staffService.getStaffById(parseInt(id));
      
      // Update form with latest data
      setNewStaff({
        name: updatedStaffData.name,
        photo_url: updatedStaffData.photo_url,
        empl_no: updatedStaffData.empl_no,
        id_no: updatedStaffData.id_no,
        role: updatedStaffData.role,
        designation: updatedStaffData.designation || '',
        employment_type: updatedStaffData.employment_type || 'Consultant',
        gender: updatedStaffData.gender || '',
        business_email: updatedStaffData.business_email || '',
        department_email: updatedStaffData.department_email || '',
        phone_number: updatedStaffData.phone_number || '',
        salary: updatedStaffData.salary || null,
        department: updatedStaffData.department || '',
        department_id: updatedStaffData.department_id,
      });
      
      // Update extended fields
      setManagerId(updatedStaffData.manager_id || '');
      setDateOfBirth(updatedStaffData.date_of_birth || '');
      setMaritalStatus(updatedStaffData.marital_status || '');
      setNationality(updatedStaffData.nationality || '');
      setAddress(updatedStaffData.address || '');
      setOfferDate(updatedStaffData.offer_date || '');
      setStartDate(updatedStaffData.start_date || '');
      setNhifNumber(updatedStaffData.nhif_number || '');
      setNssfNumber(updatedStaffData.nssf_number || '');
      setKraPin(updatedStaffData.kra_pin || '');
      setPassportNumber(updatedStaffData.passport_number || '');
      setBankName(updatedStaffData.bank_name || '');
      setBankBranch(updatedStaffData.bank_branch || '');
      setAccountNumber(updatedStaffData.account_number || '');
      setAccountName(updatedStaffData.account_name || '');
      setSwiftCode(updatedStaffData.swift_code || '');
      
      // Update benefits
      if (updatedStaffData.benefits && Array.isArray(updatedStaffData.benefits)) {
        setBenefit1(updatedStaffData.benefits[0] || '');
        setBenefit2(updatedStaffData.benefits[1] || '');
        setBenefit3(updatedStaffData.benefits[2] || '');
      }
      
      // Update beneficiaries
      if (updatedStaffData.beneficiaries && Array.isArray(updatedStaffData.beneficiaries)) {
        if (updatedStaffData.beneficiaries[0]) {
          setBeneficiary1Name(updatedStaffData.beneficiaries[0].name || '');
          setBeneficiary1Relationship(updatedStaffData.beneficiaries[0].relationship || '');
          setBeneficiary1Contact(updatedStaffData.beneficiaries[0].contact || '');
        }
        if (updatedStaffData.beneficiaries[1]) {
          setBeneficiary2Name(updatedStaffData.beneficiaries[1].name || '');
          setBeneficiary2Relationship(updatedStaffData.beneficiaries[1].relationship || '');
          setBeneficiary2Contact(updatedStaffData.beneficiaries[1].contact || '');
        }
      }
      
      // Update emergency contacts
      if (updatedStaffData.emergency_contacts && Array.isArray(updatedStaffData.emergency_contacts)) {
        if (updatedStaffData.emergency_contacts[0]) {
          setEmergency1Name(updatedStaffData.emergency_contacts[0].name || '');
          setEmergency1Relationship(updatedStaffData.emergency_contacts[0].relationship || '');
          setEmergency1Contact(updatedStaffData.emergency_contacts[0].contact || '');
        }
        if (updatedStaffData.emergency_contacts[1]) {
          setEmergency2Name(updatedStaffData.emergency_contacts[1].name || '');
          setEmergency2Relationship(updatedStaffData.emergency_contacts[1].relationship || '');
          setEmergency2Contact(updatedStaffData.emergency_contacts[1].contact || '');
        }
      }
      
      // Update family
      if (updatedStaffData.family && Array.isArray(updatedStaffData.family)) {
        if (updatedStaffData.family[0]) {
          setFamily1Name(updatedStaffData.family[0].name || '');
          setFamily1Relationship(updatedStaffData.family[0].relationship || '');
          setFamily1Contact(updatedStaffData.family[0].contact || '');
        }
        if (updatedStaffData.family[1]) {
          setFamily2Name(updatedStaffData.family[1].name || '');
          setFamily2Relationship(updatedStaffData.family[1].relationship || '');
          setFamily2Contact(updatedStaffData.family[1].contact || '');
        }
        if (updatedStaffData.family[2]) {
          setFamily3Name(updatedStaffData.family[2].name || '');
          setFamily3Relationship(updatedStaffData.family[2].relationship || '');
          setFamily3Contact(updatedStaffData.family[2].contact || '');
        }
      }
      
      // Update education
      if (updatedStaffData.education && Array.isArray(updatedStaffData.education)) {
        if (updatedStaffData.education[0]) {
          setEducation1Institution(updatedStaffData.education[0].institution || '');
          setEducation1Qualification(updatedStaffData.education[0].qualification || '');
          setEducation1Year(updatedStaffData.education[0].year_of_completion || '');
        }
        if (updatedStaffData.education[1]) {
          setEducation2Institution(updatedStaffData.education[1].institution || '');
          setEducation2Qualification(updatedStaffData.education[1].qualification || '');
          setEducation2Year(updatedStaffData.education[1].year_of_completion || '');
        }
        if (updatedStaffData.education[2]) {
          setEducation3Institution(updatedStaffData.education[2].institution || '');
          setEducation3Qualification(updatedStaffData.education[2].qualification || '');
          setEducation3Year(updatedStaffData.education[2].year_of_completion || '');
        }
        if (updatedStaffData.education[3]) {
          setEducation4Institution(updatedStaffData.education[3].institution || '');
          setEducation4Qualification(updatedStaffData.education[3].qualification || '');
          setEducation4Year(updatedStaffData.education[3].year_of_completion || '');
        }
        if (updatedStaffData.education[4]) {
          setEducation5Institution(updatedStaffData.education[4].institution || '');
          setEducation5Qualification(updatedStaffData.education[4].qualification || '');
          setEducation5Year(updatedStaffData.education[4].year_of_completion || '');
        }
      }
      
      // Update work experience
      if (updatedStaffData.work_experience && Array.isArray(updatedStaffData.work_experience)) {
        if (updatedStaffData.work_experience[0]) {
          setExperience1Organization(updatedStaffData.work_experience[0].organization || '');
          setExperience1Designation(updatedStaffData.work_experience[0].designation || '');
          setExperience1From(updatedStaffData.work_experience[0].from_date || '');
          setExperience1To(updatedStaffData.work_experience[0].to_date || '');
          setExperience1Reason(updatedStaffData.work_experience[0].reason_for_leaving || '');
        }
        if (updatedStaffData.work_experience[1]) {
          setExperience2Organization(updatedStaffData.work_experience[1].organization || '');
          setExperience2Designation(updatedStaffData.work_experience[1].designation || '');
          setExperience2From(updatedStaffData.work_experience[1].from_date || '');
          setExperience2To(updatedStaffData.work_experience[1].to_date || '');
          setExperience2Reason(updatedStaffData.work_experience[1].reason_for_leaving || '');
        }
        if (updatedStaffData.work_experience[2]) {
          setExperience3Organization(updatedStaffData.work_experience[2].organization || '');
          setExperience3Designation(updatedStaffData.work_experience[2].designation || '');
          setExperience3From(updatedStaffData.work_experience[2].from_date || '');
          setExperience3To(updatedStaffData.work_experience[2].to_date || '');
          setExperience3Reason(updatedStaffData.work_experience[2].reason_for_leaving || '');
        }
        if (updatedStaffData.work_experience[3]) {
          setExperience4Organization(updatedStaffData.work_experience[3].organization || '');
          setExperience4Designation(updatedStaffData.work_experience[3].designation || '');
          setExperience4From(updatedStaffData.work_experience[3].from_date || '');
          setExperience4To(updatedStaffData.work_experience[3].to_date || '');
          setExperience4Reason(updatedStaffData.work_experience[3].reason_for_leaving || '');
        }
        if (updatedStaffData.work_experience[4]) {
          setExperience5Organization(updatedStaffData.work_experience[4].organization || '');
          setExperience5Designation(updatedStaffData.work_experience[4].designation || '');
          setExperience5From(updatedStaffData.work_experience[4].from_date || '');
          setExperience5To(updatedStaffData.work_experience[4].to_date || '');
          setExperience5Reason(updatedStaffData.work_experience[4].reason_for_leaving || '');
        }
      }
      
      // Update references
      if (updatedStaffData.references && Array.isArray(updatedStaffData.references)) {
        if (updatedStaffData.references[0]) {
          setRef1Name(updatedStaffData.references[0].name || '');
          setRef1Position(updatedStaffData.references[0].position || '');
          setRef1Company(updatedStaffData.references[0].company || '');
          setRef1Phone(updatedStaffData.references[0].phone || '');
          setRef1Email(updatedStaffData.references[0].email || '');
        }
        if (updatedStaffData.references[1]) {
          setRef2Name(updatedStaffData.references[1].name || '');
          setRef2Position(updatedStaffData.references[1].position || '');
          setRef2Company(updatedStaffData.references[1].company || '');
          setRef2Phone(updatedStaffData.references[1].phone || '');
          setRef2Email(updatedStaffData.references[1].email || '');
        }
      }
      
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to update staff member';
      const errorDetails = err?.response?.data?.error || '';
      setError(`${errorMessage}${errorDetails ? `: ${errorDetails}` : ''}`);
      setSuccess(null);
      console.error('Error updating staff:', err);
      console.error('Error response:', err?.response?.data);
    } finally {
      setIsUploading(false);
    }
  };

  const exportToPDF = async () => {
    try {
      setIsGeneratingPdf(true);
      
      // Fetch the latest staff data
      if (!id) return;
      const staffData = await staffService.getStaffById(parseInt(id));
      
      const doc = new jsPDF();
      let yPosition = 20;
      
      // Helper function to add a section
      const addSection = (title: string, data: any[][]) => {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(title, 14, yPosition);
        yPosition += 6;
        
        autoTable(doc, {
          head: [['Field', 'Value']],
          body: data,
          startY: yPosition,
          theme: 'striped',
          headStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: 'bold', fontSize: 7 },
          styles: { fontSize: 7, cellPadding: 2 },
          columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 120 } },
          margin: { left: 14, right: 14 }
        });
        
        yPosition = (doc as any).lastAutoTable.finalY + 8;
      };
      
      // Header
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('STAFF DETAILS', 105, 12, { align: 'center' });
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 18, { align: 'center' });
      
      yPosition = 30;
      
      // Personal Details
      const personalData = [
        ['Full Name', staffData.name || 'N/A'],
        ['Employee Number', staffData.empl_no || 'N/A'],
        ['ID Number', staffData.id_no?.toString() || 'N/A'],
        ['Date of Birth', staffData.date_of_birth || 'N/A'],
        ['Gender', staffData.gender || 'N/A'],
        ['Marital Status', staffData.marital_status || 'N/A'],
        ['Nationality', staffData.nationality || 'N/A'],
        ['Address', staffData.address || 'N/A'],
        ['Phone Number', staffData.phone_number || 'N/A'],
        ['Business Email', staffData.business_email || 'N/A'],
        ['Department Email', staffData.department_email || 'N/A'],
        ['Role', staffData.role || 'N/A'],
        ['Designation', staffData.designation || 'N/A'],
        ['Employment Type', staffData.employment_type || 'N/A'],
        ['Salary', staffData.salary ? `KES ${staffData.salary.toLocaleString()}` : 'N/A'],
        ['Department', staffData.department_name || staffData.department || 'N/A'],
      ];
      addSection('Personal Details', personalData);
      
      // Offer Details
      let managerName = 'N/A';
      if (staffData.manager_id) {
        const manager = staff.find(s => s.id === staffData.manager_id);
        if (manager) {
          managerName = manager.name;
        } else {
          // Try to fetch manager name from API if not in local list
          try {
            const managerData = await staffService.getStaffById(staffData.manager_id);
            managerName = managerData.name || 'N/A';
          } catch (e) {
            managerName = 'N/A';
          }
        }
      }
      
      const offerData = [
        ['Manager', managerName],
        ['Offer Date', staffData.offer_date || 'N/A'],
        ['Start Date', staffData.start_date || 'N/A'],
        ['Other Benefit 1', staffData.benefits && Array.isArray(staffData.benefits) && staffData.benefits[0] ? staffData.benefits[0] : 'N/A'],
        ['Other Benefit 2', staffData.benefits && Array.isArray(staffData.benefits) && staffData.benefits[1] ? staffData.benefits[1] : 'N/A'],
        ['Other Benefit 3', staffData.benefits && Array.isArray(staffData.benefits) && staffData.benefits[2] ? staffData.benefits[2] : 'N/A'],
      ];
      addSection('Offer Details', offerData);
      
      // Nominated Beneficiaries
      const beneficiaryData: any[][] = [];
      if (staffData.beneficiaries && Array.isArray(staffData.beneficiaries) && staffData.beneficiaries.length > 0) {
        staffData.beneficiaries.forEach((b: any, index: number) => {
          beneficiaryData.push([
            `Beneficiary ${index + 1}`,
            `${b.name || 'N/A'} (${b.relationship || 'N/A'}) - ${b.contact || 'N/A'}`
          ]);
        });
      }
      // Always show at least 2 beneficiary slots
      for (let i = (staffData.beneficiaries?.length || 0); i < 2; i++) {
        beneficiaryData.push([
          `Beneficiary ${i + 1}`,
          'N/A'
        ]);
      }
      addSection('Nominated Beneficiaries', beneficiaryData);
      
      // Emergency Contacts
      const emergencyData: any[][] = [];
      if (staffData.emergency_contacts && Array.isArray(staffData.emergency_contacts) && staffData.emergency_contacts.length > 0) {
        staffData.emergency_contacts.forEach((e: any, index: number) => {
          emergencyData.push([
            `Emergency Contact ${index + 1}`,
            `${e.name || 'N/A'} (${e.relationship || 'N/A'}) - ${e.contact || 'N/A'}`
          ]);
        });
      }
      // Always show at least 2 emergency contact slots
      for (let i = (staffData.emergency_contacts?.length || 0); i < 2; i++) {
        emergencyData.push([
          `Emergency Contact ${i + 1}`,
          'N/A'
        ]);
      }
      addSection('Emergency Contact Details', emergencyData);
      
      // Family Details
      const familyData: any[][] = [];
      if (staffData.family && Array.isArray(staffData.family) && staffData.family.length > 0) {
        staffData.family.forEach((f: any, index: number) => {
          familyData.push([
            `Family Member ${index + 1}`,
            `${f.name || 'N/A'} (${f.relationship || 'N/A'}) - ${f.contact || 'N/A'}`
          ]);
        });
      }
      // Always show at least 3 family member slots
      for (let i = (staffData.family?.length || 0); i < 3; i++) {
        familyData.push([
          `Family Member ${i + 1}`,
          'N/A'
        ]);
      }
      addSection('Family Details (Parents & Siblings)', familyData);
      
      // Statutory Details
      const statutoryData = [
        ['NHIF Number', staffData.nhif_number || 'N/A'],
        ['NSSF Number', staffData.nssf_number || 'N/A'],
        ['KRA PIN', staffData.kra_pin || 'N/A'],
        ['Passport Number', staffData.passport_number || 'N/A'],
      ];
      addSection('Statutory Details', statutoryData);
      
      // Bank Details
      const bankData = [
        ['Bank Name', staffData.bank_name || 'N/A'],
        ['Bank Branch', staffData.bank_branch || 'N/A'],
        ['Account Number', staffData.account_number || 'N/A'],
        ['Account Name', staffData.account_name || 'N/A'],
        ['SWIFT Code', staffData.swift_code || 'N/A'],
      ];
      addSection('Bank Details', bankData);
      
      // Education Details
      const educationData: any[][] = [];
      if (staffData.education && Array.isArray(staffData.education) && staffData.education.length > 0) {
        staffData.education.forEach((e: any, index: number) => {
          educationData.push([
            `Education ${index + 1}`,
            `${e.institution || 'N/A'} - ${e.qualification || 'N/A'} (${e.year_of_completion || 'N/A'})`
          ]);
        });
      }
      // Always show at least 5 education slots
      for (let i = (staffData.education?.length || 0); i < 5; i++) {
        educationData.push([
          `Education ${i + 1}`,
          'N/A'
        ]);
      }
      addSection('Education Details', educationData);
      
      // Work Experience
      const experienceData: any[][] = [];
      if (staffData.work_experience && Array.isArray(staffData.work_experience) && staffData.work_experience.length > 0) {
        staffData.work_experience.forEach((w: any, index: number) => {
          experienceData.push([
            `Experience ${index + 1}`,
            `${w.organization || 'N/A'} - ${w.designation || 'N/A'} (${w.from_date || 'N/A'} to ${w.to_date || 'Present'})${w.reason_for_leaving ? ` - Reason: ${w.reason_for_leaving}` : ''}`
          ]);
        });
      }
      // Always show at least 5 work experience slots
      for (let i = (staffData.work_experience?.length || 0); i < 5; i++) {
        experienceData.push([
          `Experience ${i + 1}`,
          'N/A'
        ]);
      }
      addSection('Work Experience', experienceData);
      
      // References
      const referencesData: any[][] = [];
      if (staffData.references && Array.isArray(staffData.references) && staffData.references.length > 0) {
        staffData.references.forEach((r: any, index: number) => {
          referencesData.push([
            `Reference ${index + 1}`,
            `${r.name || 'N/A'}${r.position ? ` - ${r.position}` : ''}${r.company ? ` at ${r.company}` : ''}${r.phone ? ` - Phone: ${r.phone}` : ''}${r.email ? ` - Email: ${r.email}` : ''}`
          ]);
        });
      }
      // Always show at least 2 reference slots
      for (let i = (staffData.references?.length || 0); i < 2; i++) {
        referencesData.push([
          `Reference ${i + 1}`,
          'N/A'
        ]);
      }
      addSection('References', referencesData);
      
      // Save PDF
      const fileName = `staff-details-${staffData.name?.replace(/\s+/g, '-') || 'staff'}-${staffData.empl_no || id}.pdf`;
      doc.save(fileName);
      
      setSuccess('PDF exported successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600">Loading staff data...</p>
        </div>
      </div>
    );
  }

  if (error && !id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/dashboard/staff-list')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Staff List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate('/dashboard/staff-list')}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <Icons.ArrowLeft />
                </button>
                <div>
                  <h1 className="text-base font-bold text-gray-900">Edit Staff Member</h1>
                  <p className="mt-1 text-[10px] text-gray-500">
                    Update staff member information
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={exportToPDF}
                  disabled={isGeneratingPdf || isLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isGeneratingPdf ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Generating PDF...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Export to PDF</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg max-w-6xl mx-auto">
          {/* Page Header with Photo */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                {selectedFile ? (
                  <img
                    src={URL.createObjectURL(selectedFile)}
                    alt="Preview"
                    className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 shadow-md"
                  />
                ) : newStaff.photo_url ? (
                  <img
                    src={newStaff.photo_url}
                    alt={newStaff.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 shadow-md"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-200">
                    <Icons.Photo />
                  </div>
                )}
                <label
                  htmlFor="photo"
                  className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-1.5 hover:bg-blue-700 cursor-pointer transition-colors shadow-md"
                >
                  <Icons.Upload />
                </label>
                <input
                  type="file"
                  name="photo"
                  id="photo"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">{newStaff.name || 'Staff Member'}</h2>
                <p className="text-[10px] text-gray-500">Employee #{newStaff.empl_no}</p>
              </div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="border-b border-gray-200 overflow-x-auto">
            <div className="flex space-x-1 px-6 min-w-max">
              {[
                { id: 'personal', label: 'Personal Details' },
                { id: 'offer', label: 'Offer Details' },
                { id: 'beneficiary', label: 'Nominated Beneficiary' },
                { id: 'emergency', label: 'Emergency Contact' },
                { id: 'family', label: 'Family Details' },
                { id: 'statutory', label: 'Statutory Details' },
                { id: 'bank', label: 'Bank Details' },
                { id: 'education', label: 'Education Details' },
                { id: 'experience', label: 'Work Experience' },
                { id: 'references', label: 'References' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 text-[10px] font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Form Content - This will be the same as the modal form */}
          <form onSubmit={handleSubmit} className="p-6">
            {/* Success Message */}
            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-green-800">{success}</p>
                </div>
              </div>
            )}
            
            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            )}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-[10px]">
                {error}
              </div>
            )}

            <div className="min-h-[400px]">
              {/* Personal Details Tab */}
              {activeTab === 'personal' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="col-span-1 md:col-span-2">
                    <label htmlFor="name" className="block text-[10px] font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      required
                      value={newStaff.name}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                      placeholder="Enter full name"
                    />
                  </div>
                  <div>
                    <label htmlFor="id_no" className="block text-[10px] font-medium text-gray-700 mb-2">
                      ID Number *
                    </label>
                    <input
                      type="number"
                      name="id_no"
                      id="id_no"
                      required
                      value={newStaff.id_no}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                      placeholder="123456789"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-gray-700 mb-2">
                      Gender
                    </label>
                    <select
                      name="gender"
                      value={newStaff.gender}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="phone_number" className="block text-[10px] font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone_number"
                      id="phone_number"
                      value={newStaff.phone_number || ''}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                      placeholder="+254 700 000 000"
                    />
                  </div>
                  <div>
                    <label htmlFor="business_email" className="block text-[10px] font-medium text-gray-700 mb-2">
                      Personal Email
                    </label>
                    <input
                      type="email"
                      name="business_email"
                      id="business_email"
                      value={newStaff.business_email || ''}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                      placeholder="john.doe@email.com"
                    />
                  </div>
                    <div>
                      <label htmlFor="date_of_birth" className="block text-[10px] font-medium text-gray-700 mb-2">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        name="date_of_birth"
                        id="date_of_birth"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                      />
                    </div>
                    <div>
                      <label htmlFor="marital_status" className="block text-[10px] font-medium text-gray-700 mb-2">
                        Marital Status
                      </label>
                      <select
                        name="marital_status"
                        id="marital_status"
                        value={maritalStatus}
                        onChange={(e) => setMaritalStatus(e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                      >
                        <option value="">Select status</option>
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Divorced">Divorced</option>
                        <option value="Widowed">Widowed</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="nationality" className="block text-[10px] font-medium text-gray-700 mb-2">
                        Nationality
                      </label>
                      <input
                        type="text"
                        name="nationality"
                        id="nationality"
                        value={nationality}
                        onChange={(e) => setNationality(e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                        placeholder="e.g., Kenyan"
                      />
                    </div>
                    <div className="col-span-1 md:col-span-2">
                      <label htmlFor="address" className="block text-[10px] font-medium text-gray-700 mb-2">
                        Residential Address
                      </label>
                      <textarea
                        name="address"
                        id="address"
                        rows={3}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                        placeholder="Enter full address"
                      />
                    </div>
                </div>
              )}

              {/* Offer Details Tab */}
              {activeTab === 'offer' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="empl_no" className="block text-[10px] font-medium text-gray-700 mb-2">
                      Employee Number *
                    </label>
                    <input
                      type="text"
                      name="empl_no"
                      id="empl_no"
                      required
                      value={newStaff.empl_no}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                      placeholder="EMP001"
                    />
                  </div>
                  <div>
                    <label htmlFor="designation" className="block text-[10px] font-medium text-gray-700 mb-2">
                      Designation *
                    </label>
                    <select
                      name="designation"
                      id="designation"
                      required
                      value={newStaff.designation || ''}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                    >
                      <option value="">Select Designation</option>
                      <option value="Executive">Executive</option>
                      <option value="Head of Department">Head of Department</option>
                      <option value="Staff Member">Staff Member</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="department_id" className="block text-[10px] font-medium text-gray-700 mb-2">
                      Department *
                    </label>
                    <select
                      name="department_id"
                      id="department_id"
                      required
                      value={newStaff.department_id || ''}
                      onChange={(e) => {
                        const selectedDept = myDepartments.find(dept => dept.id === parseInt(e.target.value));
                        setNewStaff(prev => ({
                          ...prev,
                          department_id: parseInt(e.target.value) || undefined,
                          department: selectedDept?.name || ''
                        }));
                      }}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                    >
                      <option value="">Select a department</option>
                      {myDepartments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-gray-700 mb-2">
                      Employment Type *
                    </label>
                    <select
                      name="employment_type"
                      value={newStaff.employment_type}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                    >
                      <option value="Consultant">Consultant</option>
                      <option value="Contract">Contract</option>
                      <option value="Permanent">Permanent</option>
                      <option value="Probation">Probation</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="salary" className="block text-[10px] font-medium text-gray-700 mb-2">
                      Salary
                    </label>
                    <input
                      type="number"
                      name="salary"
                      id="salary"
                      step="0.01"
                      min="0"
                      value={newStaff.salary || ''}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                      placeholder="50000.00"
                    />
                  </div>
                    <div>
                      <label htmlFor="offer_date" className="block text-[10px] font-medium text-gray-700 mb-2">
                        Offer Date
                      </label>
                      <input
                        type="date"
                        name="offer_date"
                        id="offer_date"
                        value={offerDate}
                        onChange={(e) => setOfferDate(e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                      />
                    </div>
                    <div>
                      <label htmlFor="start_date" className="block text-[10px] font-medium text-gray-700 mb-2">
                        Start Date
                      </label>
                      <input
                        type="date"
                        name="start_date"
                        id="start_date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                      />
                    </div>
                  <div>
                    <label htmlFor="department_email" className="block text-[10px] font-medium text-gray-700 mb-2">
                      Department Email
                    </label>
                    <input
                      type="email"
                      name="department_email"
                      id="department_email"
                      value={newStaff.department_email || ''}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                      placeholder="hr@company.com"
                    />
                  </div>
                  <div>
                    <label htmlFor="manager_id" className="block text-[10px] font-medium text-gray-700 mb-2">
                      Manager
                    </label>
                    <select
                      name="manager_id"
                      id="manager_id"
                      value={managerId}
                      onChange={(e) => setManagerId(e.target.value === '' ? '' : parseInt(e.target.value))}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                    >
                      <option value="">Select a manager</option>
                      {staff
                        .filter(member => member.status === 1 && (id ? member.id !== parseInt(id) : true))
                        .map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.name} {member.designation ? `- ${member.designation}` : ''}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-[10px] font-medium text-gray-700 mb-2">
                      Other Benefits
                    </label>
                    <div className="space-y-3">
                      <div>
                        <label htmlFor="benefit1" className="block text-[10px] text-gray-600 mb-1">
                          Benefit 1
                        </label>
                        <input
                          type="text"
                          name="benefit1"
                          id="benefit1"
                          value={benefit1}
                          onChange={(e) => setBenefit1(e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                          placeholder="e.g., Medical Insurance, Housing Allowance, etc."
                        />
                      </div>
                      <div>
                        <label htmlFor="benefit2" className="block text-[10px] text-gray-600 mb-1">
                          Benefit 2
                        </label>
                        <input
                          type="text"
                          name="benefit2"
                          id="benefit2"
                          value={benefit2}
                          onChange={(e) => setBenefit2(e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                          placeholder="e.g., Transport Allowance, etc."
                        />
                      </div>
                      <div>
                        <label htmlFor="benefit3" className="block text-[10px] text-gray-600 mb-1">
                          Benefit 3
                        </label>
                        <input
                          type="text"
                          name="benefit3"
                          id="benefit3"
                          value={benefit3}
                          onChange={(e) => setBenefit3(e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                          placeholder="e.g., Annual Leave, etc."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Nominated Beneficiary Tab */}
              {activeTab === 'beneficiary' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-[10px] font-semibold text-gray-900 mb-4">Beneficiary 1</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label htmlFor="beneficiary1_name" className="block text-[10px] font-medium text-gray-700 mb-2">
                          Name
                        </label>
                        <input
                          type="text"
                          name="beneficiary1_name"
                          id="beneficiary1_name"
                          value={beneficiary1Name}
                          onChange={(e) => setBeneficiary1Name(e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                          placeholder="Full name"
                        />
                      </div>
                      <div>
                        <label htmlFor="beneficiary1_relationship" className="block text-[10px] font-medium text-gray-700 mb-2">
                          Relationship
                        </label>
                        <select
                          name="beneficiary1_relationship"
                          id="beneficiary1_relationship"
                          value={beneficiary1Relationship}
                          onChange={(e) => setBeneficiary1Relationship(e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                        >
                          <option value="">Select relationship</option>
                          <option value="Spouse">Spouse</option>
                          <option value="Child">Child</option>
                          <option value="Parent">Parent</option>
                          <option value="Sibling">Sibling</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="beneficiary1_contact" className="block text-[10px] font-medium text-gray-700 mb-2">
                          Contact
                        </label>
                        <input
                          type="text"
                          name="beneficiary1_contact"
                          id="beneficiary1_contact"
                          value={beneficiary1Contact}
                          onChange={(e) => setBeneficiary1Contact(e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                          placeholder="Phone or Email"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-semibold text-gray-900 mb-4">Beneficiary 2</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label htmlFor="beneficiary2_name" className="block text-[10px] font-medium text-gray-700 mb-2">
                          Name
                        </label>
                        <input
                          type="text"
                          name="beneficiary2_name"
                          id="beneficiary2_name"
                          value={beneficiary2Name}
                          onChange={(e) => setBeneficiary2Name(e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                          placeholder="Full name"
                        />
                      </div>
                      <div>
                        <label htmlFor="beneficiary2_relationship" className="block text-[10px] font-medium text-gray-700 mb-2">
                          Relationship
                        </label>
                        <select
                          name="beneficiary2_relationship"
                          id="beneficiary2_relationship"
                          value={beneficiary2Relationship}
                          onChange={(e) => setBeneficiary2Relationship(e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                        >
                          <option value="">Select relationship</option>
                          <option value="Spouse">Spouse</option>
                          <option value="Child">Child</option>
                          <option value="Parent">Parent</option>
                          <option value="Sibling">Sibling</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="beneficiary2_contact" className="block text-[10px] font-medium text-gray-700 mb-2">
                          Contact
                        </label>
                        <input
                          type="text"
                          name="beneficiary2_contact"
                          id="beneficiary2_contact"
                          value={beneficiary2Contact}
                          onChange={(e) => setBeneficiary2Contact(e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                          placeholder="Phone or Email"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Emergency Contact Details Tab */}
              {activeTab === 'emergency' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-[10px] font-semibold text-gray-900 mb-4">Emergency Contact 1</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label htmlFor="emergency1_name" className="block text-[10px] font-medium text-gray-700 mb-2">
                          Name
                        </label>
                        <input
                          type="text"
                          name="emergency1_name"
                          id="emergency1_name"
                          value={emergency1Name}
                          onChange={(e) => setEmergency1Name(e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                          placeholder="Full name"
                        />
                      </div>
                      <div>
                        <label htmlFor="emergency1_relationship" className="block text-[10px] font-medium text-gray-700 mb-2">
                          Relationship
                        </label>
                        <select
                          name="emergency1_relationship"
                          id="emergency1_relationship"
                          value={emergency1Relationship}
                          onChange={(e) => setEmergency1Relationship(e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                        >
                          <option value="">Select relationship</option>
                          <option value="Spouse">Spouse</option>
                          <option value="Parent">Parent</option>
                          <option value="Sibling">Sibling</option>
                          <option value="Child">Child</option>
                          <option value="Friend">Friend</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="emergency1_contact" className="block text-[10px] font-medium text-gray-700 mb-2">
                          Contact
                        </label>
                        <input
                          type="text"
                          name="emergency1_contact"
                          id="emergency1_contact"
                          value={emergency1Contact}
                          onChange={(e) => setEmergency1Contact(e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                          placeholder="Phone or Email"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-semibold text-gray-900 mb-4">Emergency Contact 2</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label htmlFor="emergency2_name" className="block text-[10px] font-medium text-gray-700 mb-2">
                          Name
                        </label>
                        <input
                          type="text"
                          name="emergency2_name"
                          id="emergency2_name"
                          value={emergency2Name}
                          onChange={(e) => setEmergency2Name(e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                          placeholder="Full name"
                        />
                      </div>
                      <div>
                        <label htmlFor="emergency2_relationship" className="block text-[10px] font-medium text-gray-700 mb-2">
                          Relationship
                        </label>
                        <select
                          name="emergency2_relationship"
                          id="emergency2_relationship"
                          value={emergency2Relationship}
                          onChange={(e) => setEmergency2Relationship(e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                        >
                          <option value="">Select relationship</option>
                          <option value="Spouse">Spouse</option>
                          <option value="Parent">Parent</option>
                          <option value="Sibling">Sibling</option>
                          <option value="Child">Child</option>
                          <option value="Friend">Friend</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="emergency2_contact" className="block text-[10px] font-medium text-gray-700 mb-2">
                          Contact
                        </label>
                        <input
                          type="text"
                          name="emergency2_contact"
                          id="emergency2_contact"
                          value={emergency2Contact}
                          onChange={(e) => setEmergency2Contact(e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                          placeholder="Phone or Email"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Family Details Tab */}
              {activeTab === 'family' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-[10px] font-semibold text-gray-900 mb-4">Family Member 1</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label htmlFor="family1_name" className="block text-[10px] font-medium text-gray-700 mb-2">
                          Name
                        </label>
                        <input
                          type="text"
                          name="family1_name"
                          id="family1_name"
                          value={family1Name}
                          onChange={(e) => setFamily1Name(e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                          placeholder="Full name"
                        />
                      </div>
                      <div>
                        <label htmlFor="family1_relationship" className="block text-[10px] font-medium text-gray-700 mb-2">
                          Relationship
                        </label>
                        <select
                          name="family1_relationship"
                          id="family1_relationship"
                          value={family1Relationship}
                          onChange={(e) => setFamily1Relationship(e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                        >
                          <option value="">Select relationship</option>
                          <option value="Father">Father</option>
                          <option value="Mother">Mother</option>
                          <option value="Brother">Brother</option>
                          <option value="Sister">Sister</option>
                          <option value="Spouse">Spouse</option>
                          <option value="Child">Child</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="family1_contact" className="block text-[10px] font-medium text-gray-700 mb-2">
                          Contact
                        </label>
                        <input
                          type="text"
                          name="family1_contact"
                          id="family1_contact"
                          value={family1Contact}
                          onChange={(e) => setFamily1Contact(e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                          placeholder="Phone or Email"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-semibold text-gray-900 mb-4">Family Member 2</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label htmlFor="family2_name" className="block text-[10px] font-medium text-gray-700 mb-2">
                          Name
                        </label>
                        <input
                          type="text"
                          name="family2_name"
                          id="family2_name"
                          value={family2Name}
                          onChange={(e) => setFamily2Name(e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                          placeholder="Full name"
                        />
                      </div>
                      <div>
                        <label htmlFor="family2_relationship" className="block text-[10px] font-medium text-gray-700 mb-2">
                          Relationship
                        </label>
                        <select
                          name="family2_relationship"
                          id="family2_relationship"
                          value={family2Relationship}
                          onChange={(e) => setFamily2Relationship(e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                        >
                          <option value="">Select relationship</option>
                          <option value="Father">Father</option>
                          <option value="Mother">Mother</option>
                          <option value="Brother">Brother</option>
                          <option value="Sister">Sister</option>
                          <option value="Spouse">Spouse</option>
                          <option value="Child">Child</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="family2_contact" className="block text-[10px] font-medium text-gray-700 mb-2">
                          Contact
                        </label>
                        <input
                          type="text"
                          name="family2_contact"
                          id="family2_contact"
                          value={family2Contact}
                          onChange={(e) => setFamily2Contact(e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                          placeholder="Phone or Email"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-semibold text-gray-900 mb-4">Family Member 3</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label htmlFor="family3_name" className="block text-[10px] font-medium text-gray-700 mb-2">
                          Name
                        </label>
                        <input
                          type="text"
                          name="family3_name"
                          id="family3_name"
                          value={family3Name}
                          onChange={(e) => setFamily3Name(e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                          placeholder="Full name"
                        />
                      </div>
                      <div>
                        <label htmlFor="family3_relationship" className="block text-[10px] font-medium text-gray-700 mb-2">
                          Relationship
                        </label>
                        <select
                          name="family3_relationship"
                          id="family3_relationship"
                          value={family3Relationship}
                          onChange={(e) => setFamily3Relationship(e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                        >
                          <option value="">Select relationship</option>
                          <option value="Father">Father</option>
                          <option value="Mother">Mother</option>
                          <option value="Brother">Brother</option>
                          <option value="Sister">Sister</option>
                          <option value="Spouse">Spouse</option>
                          <option value="Child">Child</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="family3_contact" className="block text-[10px] font-medium text-gray-700 mb-2">
                          Contact
                        </label>
                        <input
                          type="text"
                          name="family3_contact"
                          id="family3_contact"
                          value={family3Contact}
                          onChange={(e) => setFamily3Contact(e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                          placeholder="Phone or Email"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Statutory Details Tab */}
              {activeTab === 'statutory' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="nhif_number" className="block text-[10px] font-medium text-gray-700 mb-2">
                      NHIF Number
                    </label>
                    <input
                      type="text"
                      name="nhif_number"
                      id="nhif_number"
                      value={nhifNumber}
                      onChange={(e) => setNhifNumber(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                      placeholder="NHIF Number"
                    />
                  </div>
                  <div>
                    <label htmlFor="nssf_number" className="block text-[10px] font-medium text-gray-700 mb-2">
                      NSSF Number
                    </label>
                    <input
                      type="text"
                      name="nssf_number"
                      id="nssf_number"
                      value={nssfNumber}
                      onChange={(e) => setNssfNumber(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                      placeholder="NSSF Number"
                    />
                  </div>
                  <div>
                    <label htmlFor="kra_pin" className="block text-[10px] font-medium text-gray-700 mb-2">
                      KRA PIN
                    </label>
                    <input
                      type="text"
                      name="kra_pin"
                      id="kra_pin"
                      value={kraPin}
                      onChange={(e) => setKraPin(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                      placeholder="KRA PIN"
                    />
                  </div>
                  <div>
                    <label htmlFor="passport_number" className="block text-[10px] font-medium text-gray-700 mb-2">
                      Passport Number
                    </label>
                    <input
                      type="text"
                      name="passport_number"
                      id="passport_number"
                      value={passportNumber}
                      onChange={(e) => setPassportNumber(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                      placeholder="Passport Number"
                    />
                  </div>
                </div>
              )}

              {/* Bank Details Tab */}
              {activeTab === 'bank' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="bank_name" className="block text-[10px] font-medium text-gray-700 mb-2">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      name="bank_name"
                      id="bank_name"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                      placeholder="Bank Name"
                    />
                  </div>
                  <div>
                    <label htmlFor="bank_branch" className="block text-[10px] font-medium text-gray-700 mb-2">
                      Branch
                    </label>
                    <input
                      type="text"
                      name="bank_branch"
                      id="bank_branch"
                      value={bankBranch}
                      onChange={(e) => setBankBranch(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                      placeholder="Branch Name"
                    />
                  </div>
                  <div>
                    <label htmlFor="account_number" className="block text-[10px] font-medium text-gray-700 mb-2">
                      Account Number
                    </label>
                    <input
                      type="text"
                      name="account_number"
                      id="account_number"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                      placeholder="Account Number"
                    />
                  </div>
                  <div>
                    <label htmlFor="account_name" className="block text-[10px] font-medium text-gray-700 mb-2">
                      Account Name
                    </label>
                    <input
                      type="text"
                      name="account_name"
                      id="account_name"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                      placeholder="Account Holder Name"
                    />
                  </div>
                  <div>
                    <label htmlFor="swift_code" className="block text-[10px] font-medium text-gray-700 mb-2">
                      SWIFT Code
                    </label>
                    <input
                      type="text"
                      name="swift_code"
                      id="swift_code"
                      value={swiftCode}
                      onChange={(e) => setSwiftCode(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                      placeholder="SWIFT Code"
                    />
                  </div>
                </div>
              )}

              {/* Education Details Tab */}
              {activeTab === 'education' && (
                <div className="space-y-6">
                  {[1, 2, 3, 4, 5].map((num) => {
                    const institution = num === 1 ? education1Institution : num === 2 ? education2Institution : num === 3 ? education3Institution : num === 4 ? education4Institution : education5Institution;
                    const qualification = num === 1 ? education1Qualification : num === 2 ? education2Qualification : num === 3 ? education3Qualification : num === 4 ? education4Qualification : education5Qualification;
                    const year = num === 1 ? education1Year : num === 2 ? education2Year : num === 3 ? education3Year : num === 4 ? education4Year : education5Year;
                    const setInstitution = num === 1 ? setEducation1Institution : num === 2 ? setEducation2Institution : num === 3 ? setEducation3Institution : num === 4 ? setEducation4Institution : setEducation5Institution;
                    const setQualification = num === 1 ? setEducation1Qualification : num === 2 ? setEducation2Qualification : num === 3 ? setEducation3Qualification : num === 4 ? setEducation4Qualification : setEducation5Qualification;
                    const setYear = num === 1 ? setEducation1Year : num === 2 ? setEducation2Year : num === 3 ? setEducation3Year : num === 4 ? setEducation4Year : setEducation5Year;
                    
                    return (
                      <div key={num}>
                        <h4 className="text-[10px] font-semibold text-gray-900 mb-4">Education {num}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label htmlFor={`education${num}_institution`} className="block text-[10px] font-medium text-gray-700 mb-2">
                              Institution
                            </label>
                            <input
                              type="text"
                              name={`education${num}_institution`}
                              id={`education${num}_institution`}
                              value={institution}
                              onChange={(e) => setInstitution(e.target.value)}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                              placeholder="Institution Name"
                            />
                          </div>
                          <div>
                            <label htmlFor={`education${num}_qualification`} className="block text-[10px] font-medium text-gray-700 mb-2">
                              Qualification
                            </label>
                            <input
                              type="text"
                              name={`education${num}_qualification`}
                              id={`education${num}_qualification`}
                              value={qualification}
                              onChange={(e) => setQualification(e.target.value)}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                              placeholder="Degree/Diploma/Certificate"
                            />
                          </div>
                          <div>
                            <label htmlFor={`education${num}_year`} className="block text-[10px] font-medium text-gray-700 mb-2">
                              Year of Completion
                            </label>
                            <input
                              type="text"
                              name={`education${num}_year`}
                              id={`education${num}_year`}
                              value={year}
                              onChange={(e) => setYear(e.target.value)}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                              placeholder="Year"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Work Experience Tab */}
              {activeTab === 'experience' && (
                <div className="space-y-6">
                  {[1, 2, 3, 4, 5].map((num) => {
                    const organization = num === 1 ? experience1Organization : num === 2 ? experience2Organization : num === 3 ? experience3Organization : num === 4 ? experience4Organization : experience5Organization;
                    const designation = num === 1 ? experience1Designation : num === 2 ? experience2Designation : num === 3 ? experience3Designation : num === 4 ? experience4Designation : experience5Designation;
                    const from = num === 1 ? experience1From : num === 2 ? experience2From : num === 3 ? experience3From : num === 4 ? experience4From : experience5From;
                    const to = num === 1 ? experience1To : num === 2 ? experience2To : num === 3 ? experience3To : num === 4 ? experience4To : experience5To;
                    const reason = num === 1 ? experience1Reason : num === 2 ? experience2Reason : num === 3 ? experience3Reason : num === 4 ? experience4Reason : experience5Reason;
                    const setOrganization = num === 1 ? setExperience1Organization : num === 2 ? setExperience2Organization : num === 3 ? setExperience3Organization : num === 4 ? setExperience4Organization : setExperience5Organization;
                    const setDesignation = num === 1 ? setExperience1Designation : num === 2 ? setExperience2Designation : num === 3 ? setExperience3Designation : num === 4 ? setExperience4Designation : setExperience5Designation;
                    const setFrom = num === 1 ? setExperience1From : num === 2 ? setExperience2From : num === 3 ? setExperience3From : num === 4 ? setExperience4From : setExperience5From;
                    const setTo = num === 1 ? setExperience1To : num === 2 ? setExperience2To : num === 3 ? setExperience3To : num === 4 ? setExperience4To : setExperience5To;
                    const setReason = num === 1 ? setExperience1Reason : num === 2 ? setExperience2Reason : num === 3 ? setExperience3Reason : num === 4 ? setExperience4Reason : setExperience5Reason;
                    
                    return (
                      <div key={num}>
                        <h4 className="text-[10px] font-semibold text-gray-900 mb-4">Work Experience {num}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor={`experience${num}_organization`} className="block text-[10px] font-medium text-gray-700 mb-2">
                              Organization
                            </label>
                            <input
                              type="text"
                              name={`experience${num}_organization`}
                              id={`experience${num}_organization`}
                              value={organization}
                              onChange={(e) => setOrganization(e.target.value)}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                              placeholder="Organization Name"
                            />
                          </div>
                          <div>
                            <label htmlFor={`experience${num}_designation`} className="block text-[10px] font-medium text-gray-700 mb-2">
                              Designation
                            </label>
                            <input
                              type="text"
                              name={`experience${num}_designation`}
                              id={`experience${num}_designation`}
                              value={designation}
                              onChange={(e) => setDesignation(e.target.value)}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                              placeholder="Job Title/Position"
                            />
                          </div>
                          <div>
                            <label htmlFor={`experience${num}_from`} className="block text-[10px] font-medium text-gray-700 mb-2">
                              From
                            </label>
                            <input
                              type="date"
                              name={`experience${num}_from`}
                              id={`experience${num}_from`}
                              value={from}
                              onChange={(e) => setFrom(e.target.value)}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                            />
                          </div>
                          <div>
                            <label htmlFor={`experience${num}_to`} className="block text-[10px] font-medium text-gray-700 mb-2">
                              To
                            </label>
                            <input
                              type="date"
                              name={`experience${num}_to`}
                              id={`experience${num}_to`}
                              value={to}
                              onChange={(e) => setTo(e.target.value)}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                            />
                          </div>
                          <div className="col-span-1 md:col-span-2">
                            <label htmlFor={`experience${num}_reason`} className="block text-[10px] font-medium text-gray-700 mb-2">
                              Reason for Leaving
                            </label>
                            <textarea
                              name={`experience${num}_reason`}
                              id={`experience${num}_reason`}
                              value={reason}
                              onChange={(e) => setReason(e.target.value)}
                              rows={2}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                              placeholder="Reason for leaving"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* References Tab */}
              {activeTab === 'references' && (
                <div className="space-y-6">
                  {[1, 2].map((num) => {
                    const name = num === 1 ? ref1Name : ref2Name;
                    const setName = num === 1 ? setRef1Name : setRef2Name;
                    const position = num === 1 ? ref1Position : ref2Position;
                    const setPosition = num === 1 ? setRef1Position : setRef2Position;
                    const company = num === 1 ? ref1Company : ref2Company;
                    const setCompany = num === 1 ? setRef1Company : setRef2Company;
                    const phone = num === 1 ? ref1Phone : ref2Phone;
                    const setPhone = num === 1 ? setRef1Phone : setRef2Phone;
                    const email = num === 1 ? ref1Email : ref2Email;
                    const setEmail = num === 1 ? setRef1Email : setRef2Email;
                    
                    return (
                      <div key={num}>
                        <h4 className="text-[10px] font-semibold text-gray-900 mb-4">Reference {num}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor={`ref${num}_name`} className="block text-[10px] font-medium text-gray-700 mb-2">
                              Name
                            </label>
                            <input
                              type="text"
                              name={`ref${num}_name`}
                              id={`ref${num}_name`}
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                              placeholder="Full Name"
                            />
                          </div>
                          <div>
                            <label htmlFor={`ref${num}_position`} className="block text-[10px] font-medium text-gray-700 mb-2">
                              Position
                            </label>
                            <input
                              type="text"
                              name={`ref${num}_position`}
                              id={`ref${num}_position`}
                              value={position}
                              onChange={(e) => setPosition(e.target.value)}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                              placeholder="Job Title"
                            />
                          </div>
                          <div>
                            <label htmlFor={`ref${num}_company`} className="block text-[10px] font-medium text-gray-700 mb-2">
                              Company
                            </label>
                            <input
                              type="text"
                              name={`ref${num}_company`}
                              id={`ref${num}_company`}
                              value={company}
                              onChange={(e) => setCompany(e.target.value)}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                              placeholder="Company Name"
                            />
                          </div>
                          <div>
                            <label htmlFor={`ref${num}_phone`} className="block text-[10px] font-medium text-gray-700 mb-2">
                              Phone
                            </label>
                            <input
                              type="tel"
                              name={`ref${num}_phone`}
                              id={`ref${num}_phone`}
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                              placeholder="+254 700 000 000"
                            />
                          </div>
                          <div>
                            <label htmlFor={`ref${num}_email`} className="block text-[10px] font-medium text-gray-700 mb-2">
                              Email
                            </label>
                            <input
                              type="email"
                              name={`ref${num}_email`}
                              id={`ref${num}_email`}
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                              placeholder="email@example.com"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/dashboard/staff-list')}
                className="px-4 py-2 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUploading}
                className={`px-4 py-2 text-[10px] font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors ${
                  isUploading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isUploading ? 'Saving...' : 'Update Staff'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditStaffPage;

