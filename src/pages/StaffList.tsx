import React, { useState, useEffect, useRef } from 'react';
import { Staff, staffService, CreateStaffData } from '../services/staffService';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { teamService } from '../services/teamService';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

// Enhanced SVG icons for modern design
const Icons = {
  Plus: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
  Download: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  Search: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  Filter: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>,
  Eye: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
  Edit: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
  UserPlus: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>,
  UserMinus: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
  Document: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  Photo: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  Grid: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
  List: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>,
  MoreVertical: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>,
  Badge: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>,
  Clock: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Upload: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>,
  ChevronDown: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>,
  X: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
};

// Interface for team creation (used in team modal - kept for future functionality)
// @ts-ignore - Team interface kept for future use
interface Team {
  id: number;
  name: string;
  members: Staff[];
  created_at: string;
}

const REQUIRED_ROLES = ['Team Leader', 'Driver', 'Cash Officer', 'Police'];

const StaffList: React.FC = () => {
  const navigate = useNavigate();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<Staff[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [myDepartments, setMyDepartments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
  const contentRef = useRef<HTMLDivElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  
  // Enhanced state for redesigned interface
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedEmploymentType, setSelectedEmploymentType] = useState('');
  const [selectedGender, setSelectedGender] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy] = useState<'name' | 'role' | 'date'>('name'); // Future use for sorting
  const [sortOrder] = useState<'asc' | 'desc'>('asc'); // Future use for sorting
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [actionMenuStaffId, setActionMenuStaffId] = useState<number | null>(null);
  const [expandedPhoto, setExpandedPhoto] = useState<{url: string, name: string} | null>(null);
  const [activeTab, setActiveTab] = useState<string>('personal');
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

  // Get current date in format: DD MMMM YYYY
  const currentDate = new Date().toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  // Click outside handler to close dropdowns
  useEffect(() => {
    const handleClickOutside = () => {
      setActionMenuStaffId(null);
      setShowBulkActions(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        console.log('Fetching staff and departments data...');
        
        const [staffData, departmentsData, myDepartmentsData] = await Promise.all([
          staffService.getStaffList(),
          api.get('/departments').then(res => res.data),
          staffService.getDepartments()
        ]);
        
        console.log('Staff data:', staffData);
        console.log('Departments data:', departmentsData);
        console.log('My Departments data:', myDepartmentsData);
        
        setStaff(staffData);
        setFilteredStaff(staffData);
        setDepartments(departmentsData);
        setMyDepartments(myDepartmentsData);
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        let errorMessage = 'Failed to load data. Please try again later.';
        
        if (err instanceof Error) {
          errorMessage = `Error: ${err.message}`;
        } else if (typeof err === 'object' && err !== null && 'response' in err) {
          const errorWithResponse = err as { response: { data: { message?: string } } };
          errorMessage = `Server Error: ${errorWithResponse.response.data.message || 'Unknown error'}`;
        }
        
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Enhanced filtering and sorting logic
  useEffect(() => {
    let filtered = [...staff];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(member => 
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.empl_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.id_no.toString().includes(searchTerm) ||
        (member.gender && member.gender.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (member.business_email && member.business_email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (member.department_email && member.department_email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Apply role filter
    if (selectedRole) {
      filtered = filtered.filter(member => member.role === selectedRole);
    }
    
    // Apply status filter
    if (selectedStatus !== 'all') {
      const status = selectedStatus === 'active' ? 1 : 0;
      filtered = filtered.filter(member => member.status === status);
    }
    
    // Apply employment type filter
    if (selectedEmploymentType) {
      filtered = filtered.filter(member => member.employment_type === selectedEmploymentType);
    }
    
    // Apply gender filter
    if (selectedGender) {
      filtered = filtered.filter(member => member.gender === selectedGender);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: string | number = '';
      let bValue: string | number = '';
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'role':
          aValue = a.role.toLowerCase();
          bValue = b.role.toLowerCase();
          break;
        case 'date':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
    
    setFilteredStaff(filtered);
  }, [staff, searchTerm, selectedRole, selectedStatus, selectedEmploymentType, selectedGender, sortBy, sortOrder]);

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
    try {
      setIsUploading(true);
      let photoUrl = newStaff.photo_url;

      if (selectedFile) {
        photoUrl = await staffService.uploadPhoto(selectedFile);
      }

      if (isEditMode && editingStaff) {
        const updatedStaff = await staffService.updateStaff(editingStaff.id, {
          ...newStaff,
          photo_url: photoUrl
        });
        setStaff(prev => prev.map(s => s.id === editingStaff.id ? updatedStaff : s));
      } else {
        const createdStaff = await staffService.createStaff({
          ...newStaff,
          photo_url: photoUrl
        });
        setStaff(prev => [...prev, createdStaff]);
      }

      // Reset form and close modal
      setIsModalOpen(false);
      setIsEditMode(false);
      setEditingStaff(null);
      setActiveTab('personal');
      setNewStaff({
        name: '',
        photo_url: '',
        empl_no: '',
        id_no: 0,
        role: '',
        designation: '',
        employment_type: 'Permanent',
        gender: '',
        business_email: '',
        department_email: '',
        phone_number: '',
        salary: null,
        department: '',
        department_id: undefined,
      });
      setManagerId('');
      setBenefit1('');
      setBenefit2('');
      setBenefit3('');
      setBeneficiary1Name('');
      setBeneficiary1Relationship('');
      setBeneficiary1Contact('');
      setBeneficiary2Name('');
      setBeneficiary2Relationship('');
      setBeneficiary2Contact('');
      setEmergency1Name('');
      setEmergency1Relationship('');
      setEmergency1Contact('');
      setEmergency2Name('');
      setEmergency2Relationship('');
      setEmergency2Contact('');
      setFamily1Name('');
      setFamily1Relationship('');
      setFamily1Contact('');
      setFamily2Name('');
      setFamily2Relationship('');
      setFamily2Contact('');
      setFamily3Name('');
      setFamily3Relationship('');
      setFamily3Contact('');
      setEducation1Institution('');
      setEducation1Year('');
      setEducation1Qualification('');
      setEducation2Institution('');
      setEducation2Year('');
      setEducation2Qualification('');
      setEducation3Institution('');
      setEducation3Year('');
      setEducation3Qualification('');
      setEducation4Institution('');
      setEducation4Year('');
      setEducation4Qualification('');
      setEducation5Institution('');
      setEducation5Year('');
      setEducation5Qualification('');
      setExperience1Organization('');
      setExperience1From('');
      setExperience1To('');
      setExperience1Designation('');
      setExperience1Reason('');
      setExperience2Organization('');
      setExperience2From('');
      setExperience2To('');
      setExperience2Designation('');
      setExperience2Reason('');
      setExperience3Organization('');
      setExperience3From('');
      setExperience3To('');
      setExperience3Designation('');
      setExperience3Reason('');
      setExperience4Organization('');
      setExperience4From('');
      setExperience4To('');
      setExperience4Designation('');
      setExperience4Reason('');
      setExperience5Organization('');
      setExperience5From('');
      setExperience5To('');
      setExperience5Designation('');
      setExperience5Reason('');
      setSelectedFile(null);
    } catch (err) {
      setError(isEditMode ? 'Failed to update staff member' : 'Failed to create staff member');
      console.error('Error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const exportToPDF = async () => {
    if (!contentRef.current) return;

    setIsExporting(true);
    try {
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 297; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`cit-staff-list-${currentDate.replace(/\s+/g, '-')}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Failed to generate PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const handleEdit = (staff: Staff) => {
    navigate(`/dashboard/edit-staff/${staff.id}`);
  };

  const handleToggleStatus = async (staffId: number, currentStatus: number) => {
    try {
      const newStatus = currentStatus === 1 ? 0 : 1;
      console.log('Toggling staff status:', { staffId, currentStatus, newStatus });
      
      const updatedStaff = await staffService.updateStaffStatus(staffId, newStatus);
      console.log('Staff status updated:', updatedStaff);
      
      setStaff(prev => prev.map(s => s.id === staffId ? updatedStaff : s));
      setError(null); // Clear any existing errors
    } catch (err) {
      console.error('Error updating staff status:', err);
      setError('Failed to update staff status. Please try again.');
    }
  };

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Helper functions for future features (bulk operations)
  // const toggleStaffSelection = (staffId: number) => { ... };
  // const selectAllStaff = () => { ... };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedRole('');
    setSelectedStatus('all');
    setSelectedEmploymentType('');
    setSelectedGender('');
  };

  const handlePhotoClick = (photoUrl: string, staffName: string) => {
    setExpandedPhoto({ url: photoUrl, name: staffName });
  };


  const getStatusBadgeColor = (status: number) => {
    return status === 1 
      ? 'bg-green-100 text-green-800 border-green-200' 
      : 'bg-red-100 text-red-800 border-red-200';
  };

  const getEmploymentTypeBadgeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'consultant':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'contract':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'permanent':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getGenderBadgeColor = (gender: string) => {
    switch (gender?.toLowerCase()) {
      case 'male':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'female':
        return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'other':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsCreatingTeam(true);
      
      // Get active staff members grouped by role
      const staffByRole = staff.reduce((acc, member) => {
        if (member.status === 1) {
          if (!acc[member.role]) {
            acc[member.role] = [];
          }
          acc[member.role].push(member);
        }
        return acc;
      }, {} as Record<string, Staff[]>);

      // Check if we have enough staff for each required role
      const missingRoles = REQUIRED_ROLES.filter(role => 
        !staffByRole[role] || staffByRole[role].length === 0
      );

      if (missingRoles.length > 0) {
        setError(`Missing staff for roles: ${missingRoles.join(', ')}`);
        return;
      }

      // Shuffle staff within each role
      Object.keys(staffByRole).forEach(role => {
        staffByRole[role] = shuffleArray(staffByRole[role]);
      });

      // Create teams ensuring each has the required roles
      const teams: Staff[][] = [];
      let teamIndex = 0;
      let canCreateMoreTeams = true;

      while (canCreateMoreTeams) {
        const team: Staff[] = [];
        
        // Try to add one staff member from each required role
        for (const role of REQUIRED_ROLES) {
          if (staffByRole[role].length > teamIndex) {
            team.push(staffByRole[role][teamIndex]);
          } else {
            canCreateMoreTeams = false;
            break;
          }
        }

        if (canCreateMoreTeams) {
          teams.push(team);
          teamIndex++;
        }
      }

      if (teams.length === 0) {
        setError('Not enough staff to create any teams');
        return;
      }

      // Create each team
      for (const teamMembers of teams) {
        await teamService.createTeam({
          name: `${teamName} ${teams.indexOf(teamMembers) + 1}`,
          members: teamMembers.map(member => member.id)
        });
      }

      setIsTeamModalOpen(false);
      setTeamName('');
      setError(null);
    } catch (err) {
      console.error('Error creating teams:', err);
      setError('Failed to create teams');
    } finally {
      setIsCreatingTeam(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Loading Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="h-8 bg-gray-200 rounded-lg w-48 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-64 mt-2 animate-pulse"></div>
                </div>
                <div className="h-10 bg-gray-200 rounded-lg w-32 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
          {/* Loading Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-gray-200 rounded-lg animate-pulse w-12 h-12"></div>
                  <div className="ml-4 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-20 animate-pulse mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-12 animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Loading Content */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-sm font-medium text-gray-900">Loading staff list...</p>
              <p className="text-[10px] text-gray-500">Please wait while we fetch your team data</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-base font-bold text-gray-900">Staff Management</h1>
                  <p className="mt-1 text-[10px] text-gray-500">
                    Manage your team members and track their information
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-red-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Error Loading Staff Data</h3>
                  <p className="text-red-600 mb-4 text-[10px]">{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-[10px]"
                  >
                    Try Again
                  </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modern Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-base font-bold text-gray-900">Staff Management</h1>
                <p className="mt-1 text-[10px] text-gray-500">
                  Manage your team members and track their information
                </p>
              </div>
              <button
                onClick={() => {
                  setActiveTab('personal');
                  setIsModalOpen(true);
                }}
                    className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-[10px]"
              >
                <Icons.Plus />
                <span className="ml-2">Add Staff</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 hidden">
          <div 
            className={`rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow ${
              selectedStatus === 'active' 
                ? 'bg-green-50 border-2 border-green-200' 
                : 'bg-white'
            }`}
            onClick={() => setSelectedStatus(selectedStatus === 'active' ? 'all' : 'active')}
          >
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Icons.Badge />
              </div>
              <div className="ml-4">
                <p className="text-[10px] font-medium text-gray-600">Active</p>
                <p className="text-base font-semibold text-gray-900">
                  {staff.filter(s => s.status === 1).length}
                </p>
              </div>
            </div>
          </div>
          
          <div 
            className={`rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow ${
              selectedStatus === 'inactive' 
                ? 'bg-red-50 border-2 border-red-200' 
                : 'bg-white'
            }`}
            onClick={() => setSelectedStatus(selectedStatus === 'inactive' ? 'all' : 'inactive')}
          >
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <Icons.UserMinus />
              </div>
              <div className="ml-4">
                <p className="text-[10px] font-medium text-gray-600">Inactive</p>
                <p className="text-base font-semibold text-gray-900">
                  {staff.filter(s => s.status === 0).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Icons.Search />
                </div>
                <input
                  type="text"
                  placeholder="Search staff..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                />
              </div>

              {/* Controls */}
              <div className="flex items-center space-x-4">
                {/* Filters Toggle */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="inline-flex items-center px-2 py-1.5 border border-gray-300 rounded-lg text-[10px] text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Icons.Filter />
                  <span className="ml-2">Filters</span>
                  {(selectedRole || selectedStatus !== 'all' || selectedEmploymentType || selectedGender) && (
                    <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-800">
                      {selectedStatus === 'active' ? 'Active' : selectedStatus === 'inactive' ? 'Inactive' : 'Filtered'}
                    </span>
                  )}
                </button>

                {/* View Toggle */}
                <div className="flex border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-l-lg ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    title="Table View"
                  >
                    <Icons.List />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-r-lg ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    title="Card View"
                  >
                    <Icons.Grid />
                  </button>
                </div>

                {/* Export and Actions */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={exportToPDF}
                    disabled={isExporting}
                    className="inline-flex items-center px-2 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    <Icons.Download />
                    <span className="ml-2">{isExporting ? 'Exporting...' : 'Export'}</span>
                  </button>

                                    {/* Quick Links */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowBulkActions(!showBulkActions);
                      }}
                      className="inline-flex items-center px-2 py-1.5 border border-gray-300 rounded-lg text-[10px] text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <Icons.MoreVertical />
                      <Icons.ChevronDown />
                    </button>
                    
                    {showBulkActions && (
                      <div 
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10"
                      >
                        <div className="py-1">
                          <Link
                            to="/dashboard/photo-list"
                            className="block px-3 py-1.5 text-[10px] text-gray-700 hover:bg-gray-100"
                            onClick={() => setShowBulkActions(false)}
              >
                Photo List
                          </Link>
              <Link
                to="/dashboard/employee-warnings"
                            className="block px-3 py-1.5 text-[10px] text-gray-700 hover:bg-gray-100"
                            onClick={() => setShowBulkActions(false)}
              >
                Employee Warnings
              </Link>
              <Link
                to="/dashboard/expiring-contracts"
                            className="block px-3 py-1.5 text-[10px] text-gray-700 hover:bg-gray-100"
                            onClick={() => setShowBulkActions(false)}
              >
                Expiring Contracts
              </Link>
              <Link
                to="/upload-document"
                            className="block px-3 py-1.5 text-[10px] text-gray-700 hover:bg-gray-100"
                            onClick={() => setShowBulkActions(false)}
              >
                Upload Documents
              </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-[10px] font-medium text-gray-700 mb-1">Role</label>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="block w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                    >
                      <option value="">All Roles</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.name}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="block w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-medium text-gray-700 mb-1">Employment Type</label>
                    <select
                      value={selectedEmploymentType}
                      onChange={(e) => setSelectedEmploymentType(e.target.value)}
                      className="block w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                    >
                      <option value="">All Types</option>
                      <option value="Consultant">Consultant</option>
                      <option value="Contract">Contract</option>
                      <option value="Probation ">Probation</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-medium text-gray-700 mb-1">Gender</label>
                    <select
                      value={selectedGender}
                      onChange={(e) => setSelectedGender(e.target.value)}
                      className="block w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                    >
                      <option value="">All Genders</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  
                  <div className="flex items-end">
              <button
                      onClick={clearFilters}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-[10px] text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Clear Filters
              </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div ref={contentRef}>
          {filteredStaff.length === 0 ? (
            // Empty State
            <div className="bg-white rounded-lg shadow text-center py-12">
              <Icons.UserPlus />
              <h3 className="mt-4 text-sm font-medium text-gray-900">No staff members found</h3>
              <p className="mt-2 text-[10px] text-gray-500">
                {searchTerm || selectedRole || selectedStatus !== 'all' || selectedEmploymentType || selectedGender
                  ? 'Try adjusting your search or filters'
                  : 'Get started by adding your first staff member'}
              </p>
              {!searchTerm && !selectedRole && selectedStatus === 'all' && !selectedEmploymentType && !selectedGender && (
                <button
                  onClick={() => {
                    setActiveTab('personal');
                    setIsModalOpen(true);
                  }}
                  className="mt-4 inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-[10px]"
                >
                  <Icons.Plus />
                  <span className="ml-2">Add Staff Member</span>
                </button>
              )}
            </div>
                    ) : viewMode === 'list' ? (
            // Table View (Primary View)
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                        Staff Member
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden">
                        Role
                      </th>
                      <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                        Designation
                      </th>
                      <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                        Department
                      </th>
                      <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                        Employee #
                      </th>
                      <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                        ID Number
                      </th>
                      <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                        Employment Type
                      </th>
                      <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                        Gender
                      </th>
                      <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                        Business Email
                      </th>
                      <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                        Department Email
                      </th>
                      <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                        Salary
                      </th>
                      <th scope="col" className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredStaff.map((member) => (
                      <tr key={member.id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="relative">
                              {member.photo_url ? (
                                <img
                                  src={member.photo_url}
                                  alt={member.name}
                                  className="w-10 h-10 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => handlePhotoClick(member.photo_url, member.name)}
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                  <span className="text-xs font-semibold text-gray-600">
                                    {member.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                              <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                                member.status === 1 ? 'bg-green-400' : 'bg-red-400'
                              }`}></div>
                            </div>
                            <div className="ml-4">
                              <div className="text-[10px] font-medium text-gray-900">{member.name}</div>
                              <div className="text-[10px] text-gray-500">{member.role}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap hidden">
                          <div className="text-[10px] text-gray-900">{member.role}</div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="text-[10px] text-gray-900">{member.designation || member.role || <span className="text-gray-500">-</span>}</div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="text-[10px] text-gray-900">
                            {member.department_name || member.department || <span className="text-gray-500">-</span>}
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="text-[10px] text-gray-900 font-mono">{member.empl_no}</div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="text-[10px] text-gray-900 font-mono">{member.id_no}</div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="text-[10px] text-gray-900">
                            {member.phone_number || <span className="text-gray-500">-</span>}
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${getStatusBadgeColor(member.status)}`}>
                            {member.status === 1 ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {member.employment_type && (
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${getEmploymentTypeBadgeColor(member.employment_type)}`}>
                              {member.employment_type}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {member.gender ? (
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${getGenderBadgeColor(member.gender)}`}>
                              {member.gender}
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="text-[10px] text-gray-900">
                            {member.business_email || <span className="text-gray-500">-</span>}
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="text-[10px] text-gray-900">
                            {member.department_email || <span className="text-gray-500">-</span>}
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="text-[10px] text-gray-900 font-mono">
                            {member.salary ? member.salary.toLocaleString() : <span className="text-gray-500">-</span>}
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-right text-[10px] font-medium">
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActionMenuStaffId(actionMenuStaffId === member.id ? null : member.id);
                              }}
                              className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors duration-150"
                              title="Actions"
                            >
                              <Icons.MoreVertical />
                            </button>
                            
                            {actionMenuStaffId === member.id && (
                              <div 
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10"
                              >
                                <div className="py-1">
                                  <button
                                    onClick={() => {
                                      handleEdit(member);
                                      setActionMenuStaffId(null);
                                    }}
                                    className="block w-full text-left px-3 py-1.5 text-[10px] text-gray-700 hover:bg-gray-100 flex items-center"
                                  >
                                    <Icons.Edit />
                                    <span className="ml-2">Edit Profile</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleToggleStatus(member.id, member.status);
                                      setActionMenuStaffId(null);
                                    }}
                                    className="block w-full text-left px-3 py-1.5 text-[10px] text-gray-700 hover:bg-gray-100 flex items-center"
                                  >
                                    {member.status === 1 ? <Icons.UserMinus /> : <Icons.UserPlus />}
                                    <span className="ml-2">{member.status === 1 ? 'Deactivate' : 'Activate'}</span>
                                  </button>
                                  {/* <Link
                                    to={`/upload-document?staff_id=${member.id}&staff_name=${encodeURIComponent(member.name)}`}
                                    className="block px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100 flex items-center"
                                    onClick={() => setActionMenuStaffId(null)}
                                  >
                                    <Icons.Upload />
                                    <span className="ml-2">Upload Documents</span>
                                  </Link> */}
                                  <Link
                                    to={`/employee-documents?staff_id=${member.id}&staff_name=${encodeURIComponent(member.name)}`}
                                    className="block px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100 flex items-center"
                                    onClick={() => setActionMenuStaffId(null)}
                                  >
                                    <Icons.Eye />
                                    <span className="ml-2">View Documents</span>
                                  </Link>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            // Grid View (Alternative View)
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredStaff.map((member) => (
                <div
                  key={member.id}
                  className="bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200"
                >
                  <div className="p-6">
                    {/* Photo and Basic Info */}
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="relative">
                        {member.photo_url ? (
                          <img
                            src={member.photo_url}
                            alt={member.name}
                            className="w-12 h-12 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => handlePhotoClick(member.photo_url, member.name)}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-base font-semibold text-gray-600">
                              {member.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                          member.status === 1 ? 'bg-green-400' : 'bg-red-400'
                        }`}></div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">
                          {member.name}
                        </h3>
                        <p className="text-[10px] text-gray-600 truncate">{member.role}</p>
                      </div>
                      
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActionMenuStaffId(actionMenuStaffId === member.id ? null : member.id);
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <Icons.MoreVertical />
                        </button>
                        
                        {actionMenuStaffId === member.id && (
                          <div 
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10"
                          >
                            <div className="py-1">
                              <button
                                onClick={() => {
                                  handleEdit(member);
                                  setActionMenuStaffId(null);
                                }}
                                className="block w-full text-left px-3 py-1.5 text-[10px] text-gray-700 hover:bg-gray-100"
                              >
                                Edit Profile
                              </button>
                              <button
                                onClick={() => {
                                  handleToggleStatus(member.id, member.status);
                                  setActionMenuStaffId(null);
                                }}
                                className="block w-full text-left px-3 py-1.5 text-[10px] text-gray-700 hover:bg-gray-100"
                              >
                                {member.status === 1 ? 'Deactivate' : 'Activate'}
                              </button>
                              <Link
                                to={`/upload-document?staff_id=${member.id}&staff_name=${encodeURIComponent(member.name)}`}
                                className="block px-3 py-1.5 text-[10px] text-gray-700 hover:bg-gray-100"
                                onClick={() => setActionMenuStaffId(null)}
                              >
                                Upload Documents
                              </Link>
                              <Link
                                to={`/employee-documents?staff_id=${member.id}&staff_name=${encodeURIComponent(member.name)}`}
                                className="block px-3 py-1.5 text-[10px] text-gray-700 hover:bg-gray-100"
                                onClick={() => setActionMenuStaffId(null)}
                              >
                                View Documents
                              </Link>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Details */}
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-gray-600">Employee #:</span>
                        <span className="font-medium text-gray-900">{member.empl_no}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Department:</span>
                        <span className="font-medium text-gray-900">{member.department_name || member.department || '-'}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">ID Number:</span>
                        <span className="font-medium text-gray-900">{member.id_no}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Gender:</span>
                        <span className="font-medium text-gray-900">{member.gender || '-'}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Business Email:</span>
                        <span className="font-medium text-gray-900 text-right max-w-32 truncate" title={member.business_email || ''}>
                          {member.business_email || '-'}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Dept Email:</span>
                        <span className="font-medium text-gray-900 text-right max-w-32 truncate" title={member.department_email || ''}>
                          {member.department_email || '-'}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Salary:</span>
                        <span className="font-medium text-gray-900 font-mono">
                          {member.salary ? member.salary.toLocaleString() : '-'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Status Badges */}
                    <div className="flex flex-wrap gap-2">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${getStatusBadgeColor(member.status)}`}>
                        {member.status === 1 ? 'Active' : 'Inactive'}
                      </span>
                      {member.employment_type && (
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${getEmploymentTypeBadgeColor(member.employment_type)}`}>
                          {member.employment_type}
                        </span>
                      )}
                      {member.gender && (
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${getGenderBadgeColor(member.gender)}`}>
                          {member.gender}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Add/Edit Staff Modal with Tabbed Sections */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-4">
                {/* Photo Upload Section */}
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
                  <h3 className="text-sm font-semibold text-gray-900">
                    {isEditMode ? 'Edit Staff Member' : 'Add New Staff Member'}
                  </h3>
                  <p className="text-[10px] text-gray-500 mt-1">
                    {isEditMode ? 'Update staff member information' : 'Enter staff member details'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setIsEditMode(false);
                  setEditingStaff(null);
                  setActiveTab('personal');
                  setNewStaff({
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
                  setManagerId('');
                  setBenefit1('');
                  setBenefit2('');
                  setBenefit3('');
                  setSelectedFile(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Icons.X />
              </button>
            </div>

            {/* Tabs Navigation */}
            <div className="border-b border-gray-200 overflow-x-auto flex-shrink-0">
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

            {/* Modal Body - Tab Content */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
              <div className="px-6 py-6">
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
                          .filter(member => member.status === 1 && (isEditMode ? member.id !== editingStaff?.id : true))
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
                    <div className="hidden">
                      <label htmlFor="role" className="block text-[10px] font-medium text-gray-700 mb-2">
                        Role *
                      </label>
                      <select
                        name="role"
                        id="role"
                        required
                        value={newStaff.role}
                        onChange={handleInputChange}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                      >
                        <option value="">Select a role</option>
                        {departments.map((department) => (
                          <option key={department.id} value={department.name}>
                            {department.name}
                          </option>
                        ))}
                      </select>
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
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                        placeholder="SWIFT Code"
                      />
                    </div>
                  </div>
                )}

                {/* Education Details Tab */}
                {activeTab === 'education' && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-[10px] font-semibold text-gray-900 mb-4">Education 1</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label htmlFor="education1_institution" className="block text-[10px] font-medium text-gray-700 mb-2">
                            Institution
                          </label>
                          <input
                            type="text"
                            name="education1_institution"
                            id="education1_institution"
                            value={education1Institution}
                            onChange={(e) => setEducation1Institution(e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                            placeholder="Institution Name"
                          />
                        </div>
                        <div>
                          <label htmlFor="education1_qualification" className="block text-[10px] font-medium text-gray-700 mb-2">
                            Qualification
                          </label>
                          <input
                            type="text"
                            name="education1_qualification"
                            id="education1_qualification"
                            value={education1Qualification}
                            onChange={(e) => setEducation1Qualification(e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                            placeholder="Degree/Diploma/Certificate"
                          />
                        </div>
                        <div>
                          <label htmlFor="education1_year" className="block text-[10px] font-medium text-gray-700 mb-2">
                            Year of Completion
                          </label>
                          <input
                            type="text"
                            name="education1_year"
                            id="education1_year"
                            value={education1Year}
                            onChange={(e) => setEducation1Year(e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                            placeholder="Year"
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-semibold text-gray-900 mb-4">Education 2</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label htmlFor="education2_institution" className="block text-[10px] font-medium text-gray-700 mb-2">
                            Institution
                          </label>
                          <input
                            type="text"
                            name="education2_institution"
                            id="education2_institution"
                            value={education2Institution}
                            onChange={(e) => setEducation2Institution(e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                            placeholder="Institution Name"
                          />
                        </div>
                        <div>
                          <label htmlFor="education2_qualification" className="block text-[10px] font-medium text-gray-700 mb-2">
                            Qualification
                          </label>
                          <input
                            type="text"
                            name="education2_qualification"
                            id="education2_qualification"
                            value={education2Qualification}
                            onChange={(e) => setEducation2Qualification(e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                            placeholder="Degree/Diploma/Certificate"
                          />
                        </div>
                        <div>
                          <label htmlFor="education2_year" className="block text-[10px] font-medium text-gray-700 mb-2">
                            Year of Completion
                          </label>
                          <input
                            type="text"
                            name="education2_year"
                            id="education2_year"
                            value={education2Year}
                            onChange={(e) => setEducation2Year(e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                            placeholder="Year"
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-semibold text-gray-900 mb-4">Education 3</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label htmlFor="education3_institution" className="block text-[10px] font-medium text-gray-700 mb-2">
                            Institution
                          </label>
                          <input
                            type="text"
                            name="education3_institution"
                            id="education3_institution"
                            value={education3Institution}
                            onChange={(e) => setEducation3Institution(e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                            placeholder="Institution Name"
                          />
                        </div>
                        <div>
                          <label htmlFor="education3_qualification" className="block text-[10px] font-medium text-gray-700 mb-2">
                            Qualification
                          </label>
                          <input
                            type="text"
                            name="education3_qualification"
                            id="education3_qualification"
                            value={education3Qualification}
                            onChange={(e) => setEducation3Qualification(e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                            placeholder="Degree/Diploma/Certificate"
                          />
                        </div>
                        <div>
                          <label htmlFor="education3_year" className="block text-[10px] font-medium text-gray-700 mb-2">
                            Year of Completion
                          </label>
                          <input
                            type="text"
                            name="education3_year"
                            id="education3_year"
                            value={education3Year}
                            onChange={(e) => setEducation3Year(e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                            placeholder="Year"
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-semibold text-gray-900 mb-4">Education 4</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label htmlFor="education4_institution" className="block text-[10px] font-medium text-gray-700 mb-2">
                            Institution
                          </label>
                          <input
                            type="text"
                            name="education4_institution"
                            id="education4_institution"
                            value={education4Institution}
                            onChange={(e) => setEducation4Institution(e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                            placeholder="Institution Name"
                          />
                        </div>
                        <div>
                          <label htmlFor="education4_qualification" className="block text-[10px] font-medium text-gray-700 mb-2">
                            Qualification
                          </label>
                          <input
                            type="text"
                            name="education4_qualification"
                            id="education4_qualification"
                            value={education4Qualification}
                            onChange={(e) => setEducation4Qualification(e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                            placeholder="Degree/Diploma/Certificate"
                          />
                        </div>
                        <div>
                          <label htmlFor="education4_year" className="block text-[10px] font-medium text-gray-700 mb-2">
                            Year of Completion
                          </label>
                          <input
                            type="text"
                            name="education4_year"
                            id="education4_year"
                            value={education4Year}
                            onChange={(e) => setEducation4Year(e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                            placeholder="Year"
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-semibold text-gray-900 mb-4">Education 5</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label htmlFor="education5_institution" className="block text-[10px] font-medium text-gray-700 mb-2">
                            Institution
                          </label>
                          <input
                            type="text"
                            name="education5_institution"
                            id="education5_institution"
                            value={education5Institution}
                            onChange={(e) => setEducation5Institution(e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                            placeholder="Institution Name"
                          />
                        </div>
                        <div>
                          <label htmlFor="education5_qualification" className="block text-[10px] font-medium text-gray-700 mb-2">
                            Qualification
                          </label>
                          <input
                            type="text"
                            name="education5_qualification"
                            id="education5_qualification"
                            value={education5Qualification}
                            onChange={(e) => setEducation5Qualification(e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                            placeholder="Degree/Diploma/Certificate"
                          />
                        </div>
                        <div>
                          <label htmlFor="education5_year" className="block text-[10px] font-medium text-gray-700 mb-2">
                            Year of Completion
                          </label>
                          <input
                            type="text"
                            name="education5_year"
                            id="education5_year"
                            value={education5Year}
                            onChange={(e) => setEducation5Year(e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                            placeholder="Year"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Work Experience Tab */}
                {activeTab === 'experience' && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-[10px] font-semibold text-gray-900 mb-4">Work Experience 1</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="experience1_organization" className="block text-[10px] font-medium text-gray-700 mb-2">
                            Organization
                          </label>
                          <input
                            type="text"
                            name="experience1_organization"
                            id="experience1_organization"
                            value={experience1Organization}
                            onChange={(e) => setExperience1Organization(e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                            placeholder="Organization Name"
                          />
                        </div>
                        <div>
                          <label htmlFor="experience1_designation" className="block text-[10px] font-medium text-gray-700 mb-2">
                            Designation
                          </label>
                          <input
                            type="text"
                            name="experience1_designation"
                            id="experience1_designation"
                            value={experience1Designation}
                            onChange={(e) => setExperience1Designation(e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                            placeholder="Job Title/Position"
                          />
                        </div>
                        <div>
                          <label htmlFor="experience1_from" className="block text-[10px] font-medium text-gray-700 mb-2">
                            From
                          </label>
                          <input
                            type="date"
                            name="experience1_from"
                            id="experience1_from"
                            value={experience1From}
                            onChange={(e) => setExperience1From(e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                          />
                        </div>
                        <div>
                          <label htmlFor="experience1_to" className="block text-[10px] font-medium text-gray-700 mb-2">
                            To
                          </label>
                          <input
                            type="date"
                            name="experience1_to"
                            id="experience1_to"
                            value={experience1To}
                            onChange={(e) => setExperience1To(e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                          />
                        </div>
                        <div className="col-span-1 md:col-span-2">
                          <label htmlFor="experience1_reason" className="block text-[10px] font-medium text-gray-700 mb-2">
                            Reason for Leaving
                          </label>
                          <textarea
                            name="experience1_reason"
                            id="experience1_reason"
                            value={experience1Reason}
                            onChange={(e) => setExperience1Reason(e.target.value)}
                            rows={2}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                            placeholder="Reason for leaving"
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-semibold text-gray-900 mb-4">Work Experience 2</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="experience2_organization" className="block text-[10px] font-medium text-gray-700 mb-2">
                            Organization
                          </label>
                          <input
                            type="text"
                            name="experience2_organization"
                            id="experience2_organization"
                            value={experience2Organization}
                            onChange={(e) => setExperience2Organization(e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                            placeholder="Organization Name"
                          />
                        </div>
                        <div>
                          <label htmlFor="experience2_designation" className="block text-[10px] font-medium text-gray-700 mb-2">
                            Designation
                          </label>
                          <input
                            type="text"
                            name="experience2_designation"
                            id="experience2_designation"
                            value={experience2Designation}
                            onChange={(e) => setExperience2Designation(e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                            placeholder="Job Title/Position"
                          />
                        </div>
                        <div>
                          <label htmlFor="experience2_from" className="block text-[10px] font-medium text-gray-700 mb-2">
                            From
                          </label>
                          <input
                            type="date"
                            name="experience2_from"
                            id="experience2_from"
                            value={experience2From}
                            onChange={(e) => setExperience2From(e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                          />
                        </div>
                        <div>
                          <label htmlFor="experience2_to" className="block text-[10px] font-medium text-gray-700 mb-2">
                            To
                          </label>
                          <input
                            type="date"
                            name="experience2_to"
                            id="experience2_to"
                            value={experience2To}
                            onChange={(e) => setExperience2To(e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                          />
                        </div>
                        <div className="col-span-1 md:col-span-2">
                          <label htmlFor="experience2_reason" className="block text-[10px] font-medium text-gray-700 mb-2">
                            Reason for Leaving
                          </label>
                          <textarea
                            name="experience2_reason"
                            id="experience2_reason"
                            value={experience2Reason}
                            onChange={(e) => setExperience2Reason(e.target.value)}
                            rows={2}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                            placeholder="Reason for leaving"
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-semibold text-gray-900 mb-4">Work Experience 3</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="experience3_organization" className="block text-[10px] font-medium text-gray-700 mb-2">
                            Organization
                          </label>
                          <input
                            type="text"
                            name="experience3_organization"
                            id="experience3_organization"
                            value={experience3Organization}
                            onChange={(e) => setExperience3Organization(e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                            placeholder="Organization Name"
                          />
                        </div>
                        <div>
                          <label htmlFor="experience3_designation" className="block text-[10px] font-medium text-gray-700 mb-2">
                            Designation
                          </label>
                          <input
                            type="text"
                            name="experience3_designation"
                            id="experience3_designation"
                            value={experience3Designation}
                            onChange={(e) => setExperience3Designation(e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                            placeholder="Job Title/Position"
                          />
                        </div>
                        <div>
                          <label htmlFor="experience3_from" className="block text-[10px] font-medium text-gray-700 mb-2">
                            From
                          </label>
                          <input
                            type="date"
                            name="experience3_from"
                            id="experience3_from"
                            value={experience3From}
                            onChange={(e) => setExperience3From(e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                          />
                        </div>
                        <div>
                          <label htmlFor="experience3_to" className="block text-[10px] font-medium text-gray-700 mb-2">
                            To
                          </label>
                          <input
                            type="date"
                            name="experience3_to"
                            id="experience3_to"
                            value={experience3To}
                            onChange={(e) => setExperience3To(e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                          />
                        </div>
                        <div className="col-span-1 md:col-span-2">
                          <label htmlFor="experience3_reason" className="block text-[10px] font-medium text-gray-700 mb-2">
                            Reason for Leaving
                          </label>
                          <textarea
                            name="experience3_reason"
                            id="experience3_reason"
                            value={experience3Reason}
                            onChange={(e) => setExperience3Reason(e.target.value)}
                            rows={2}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                            placeholder="Reason for leaving"
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-semibold text-gray-900 mb-4">Work Experience 4</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="experience4_organization" className="block text-[10px] font-medium text-gray-700 mb-2">
                            Organization
                          </label>
                          <input
                            type="text"
                            name="experience4_organization"
                            id="experience4_organization"
                            value={experience4Organization}
                            onChange={(e) => setExperience4Organization(e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                            placeholder="Organization Name"
                          />
                        </div>
                        <div>
                          <label htmlFor="experience4_designation" className="block text-[10px] font-medium text-gray-700 mb-2">
                            Designation
                          </label>
                          <input
                            type="text"
                            name="experience4_designation"
                            id="experience4_designation"
                            value={experience4Designation}
                            onChange={(e) => setExperience4Designation(e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                            placeholder="Job Title/Position"
                          />
                        </div>
                        <div>
                          <label htmlFor="experience4_from" className="block text-[10px] font-medium text-gray-700 mb-2">
                            From
                          </label>
                          <input
                            type="date"
                            name="experience4_from"
                            id="experience4_from"
                            value={experience4From}
                            onChange={(e) => setExperience4From(e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                          />
                        </div>
                        <div>
                          <label htmlFor="experience4_to" className="block text-[10px] font-medium text-gray-700 mb-2">
                            To
                          </label>
                          <input
                            type="date"
                            name="experience4_to"
                            id="experience4_to"
                            value={experience4To}
                            onChange={(e) => setExperience4To(e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                          />
                        </div>
                        <div className="col-span-1 md:col-span-2">
                          <label htmlFor="experience4_reason" className="block text-[10px] font-medium text-gray-700 mb-2">
                            Reason for Leaving
                          </label>
                          <textarea
                            name="experience4_reason"
                            id="experience4_reason"
                            value={experience4Reason}
                            onChange={(e) => setExperience4Reason(e.target.value)}
                            rows={2}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                            placeholder="Reason for leaving"
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-semibold text-gray-900 mb-4">Work Experience 5</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="experience5_organization" className="block text-[10px] font-medium text-gray-700 mb-2">
                            Organization
                          </label>
                          <input
                            type="text"
                            name="experience5_organization"
                            id="experience5_organization"
                            value={experience5Organization}
                            onChange={(e) => setExperience5Organization(e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                            placeholder="Organization Name"
                          />
                        </div>
                        <div>
                          <label htmlFor="experience5_designation" className="block text-[10px] font-medium text-gray-700 mb-2">
                            Designation
                          </label>
                          <input
                            type="text"
                            name="experience5_designation"
                            id="experience5_designation"
                            value={experience5Designation}
                            onChange={(e) => setExperience5Designation(e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                            placeholder="Job Title/Position"
                          />
                        </div>
                        <div>
                          <label htmlFor="experience5_from" className="block text-[10px] font-medium text-gray-700 mb-2">
                            From
                          </label>
                          <input
                            type="date"
                            name="experience5_from"
                            id="experience5_from"
                            value={experience5From}
                            onChange={(e) => setExperience5From(e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                          />
                        </div>
                        <div>
                          <label htmlFor="experience5_to" className="block text-[10px] font-medium text-gray-700 mb-2">
                            To
                          </label>
                          <input
                            type="date"
                            name="experience5_to"
                            id="experience5_to"
                            value={experience5To}
                            onChange={(e) => setExperience5To(e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                          />
                        </div>
                        <div className="col-span-1 md:col-span-2">
                          <label htmlFor="experience5_reason" className="block text-[10px] font-medium text-gray-700 mb-2">
                            Reason for Leaving
                          </label>
                          <textarea
                            name="experience5_reason"
                            id="experience5_reason"
                            value={experience5Reason}
                            onChange={(e) => setExperience5Reason(e.target.value)}
                            rows={2}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                            placeholder="Reason for leaving"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* References Tab */}
                {activeTab === 'references' && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-[10px] font-semibold text-gray-900 mb-4">Reference 1</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="ref1_name" className="block text-[10px] font-medium text-gray-700 mb-2">
                            Name
                          </label>
                          <input
                            type="text"
                            name="ref1_name"
                            id="ref1_name"
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                            placeholder="Full Name"
                          />
                        </div>
                        <div>
                          <label htmlFor="ref1_position" className="block text-[10px] font-medium text-gray-700 mb-2">
                            Position
                          </label>
                          <input
                            type="text"
                            name="ref1_position"
                            id="ref1_position"
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                            placeholder="Job Title"
                          />
                        </div>
                        <div>
                          <label htmlFor="ref1_company" className="block text-[10px] font-medium text-gray-700 mb-2">
                            Company
                          </label>
                          <input
                            type="text"
                            name="ref1_company"
                            id="ref1_company"
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                            placeholder="Company Name"
                          />
                        </div>
                        <div>
                          <label htmlFor="ref1_phone" className="block text-[10px] font-medium text-gray-700 mb-2">
                            Phone
                          </label>
                          <input
                            type="tel"
                            name="ref1_phone"
                            id="ref1_phone"
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                            placeholder="+254 700 000 000"
                          />
                        </div>
                        <div>
                          <label htmlFor="ref1_email" className="block text-[10px] font-medium text-gray-700 mb-2">
                            Email
                          </label>
                          <input
                            type="email"
                            name="ref1_email"
                            id="ref1_email"
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                            placeholder="email@example.com"
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-semibold text-gray-900 mb-4">Reference 2</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="ref2_name" className="block text-[10px] font-medium text-gray-700 mb-2">
                            Name
                          </label>
                          <input
                            type="text"
                            name="ref2_name"
                            id="ref2_name"
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                            placeholder="Full Name"
                          />
                        </div>
                        <div>
                          <label htmlFor="ref2_position" className="block text-[10px] font-medium text-gray-700 mb-2">
                            Position
                          </label>
                          <input
                            type="text"
                            name="ref2_position"
                            id="ref2_position"
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                            placeholder="Job Title"
                          />
                        </div>
                        <div>
                          <label htmlFor="ref2_company" className="block text-[10px] font-medium text-gray-700 mb-2">
                            Company
                          </label>
                          <input
                            type="text"
                            name="ref2_company"
                            id="ref2_company"
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                            placeholder="Company Name"
                          />
                        </div>
                        <div>
                          <label htmlFor="ref2_phone" className="block text-[10px] font-medium text-gray-700 mb-2">
                            Phone
                          </label>
                          <input
                            type="tel"
                            name="ref2_phone"
                            id="ref2_phone"
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                            placeholder="+254 700 000 000"
                          />
                        </div>
                        <div>
                          <label htmlFor="ref2_email" className="block text-[10px] font-medium text-gray-700 mb-2">
                            Email
                          </label>
                          <input
                            type="email"
                            name="ref2_email"
                            id="ref2_email"
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                            placeholder="email@example.com"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end space-x-3 pt-6 pb-6 px-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setIsEditMode(false);
                    setEditingStaff(null);
                    setActiveTab('personal');
                    setNewStaff({
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
                    setManagerId('');
                    setBenefit1('');
                    setBenefit2('');
                    setBenefit3('');
                    setSelectedFile(null);
                  }}
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
                  {isUploading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </div>
                  ) : (
                    isEditMode ? 'Update Staff' : 'Add Staff'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isTeamModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-medium text-gray-900">
                Create Teams
              </h3>
              <button
                onClick={() => {
                  setIsTeamModalOpen(false);
                  setTeamName('');
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div>
                <label htmlFor="teamName" className="block text-[10px] font-medium text-gray-700">
                  Team Name Prefix
                </label>
                <input
                  type="text"
                  id="teamName"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-[10px] px-2 py-1.5"
                  placeholder="e.g., Team"
                />
              </div>
              
              <div className="text-[10px] text-gray-500">
                <p className="font-medium mb-2">Required Roles per Team:</p>
                <ul className="list-disc pl-5">
                  {REQUIRED_ROLES.map(role => (
                    <li key={role}>
                      {role}: {staff.filter(m => m.role === role && m.status === 1).length} available
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsTeamModalOpen(false);
                    setTeamName('');
                  }}
                  className="px-3 py-1.5 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingTeam}
                  className={`px-3 py-1.5 text-[10px] font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 ${
                    isCreatingTeam ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isCreatingTeam ? 'Creating Teams...' : 'Create Teams'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Photo Expansion Modal */}
      {expandedPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-screen overflow-y-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  {expandedPhoto.name}
                </h3>
                <p className="text-[10px] text-gray-500 mt-1">
                  Staff Photo
                </p>
              </div>
              <button
                onClick={() => setExpandedPhoto(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Icons.X />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-6 text-center">
              <img
                src={expandedPhoto.url}
                alt={expandedPhoto.name}
                className="max-w-full max-h-96 mx-auto rounded-lg shadow-lg object-contain"
                onError={(e) => {
                  e.currentTarget.src = 'https://via.placeholder.com/400x400?text=Photo+Not+Available';
                }}
              />
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setExpandedPhoto(null)}
                className="px-3 py-1.5 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffList;