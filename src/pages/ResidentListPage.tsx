import React, { useState, useEffect, useRef } from 'react';
import { Staff, staffService, CreateStaffData } from '../services/staffService';
import { Role, roleService } from '../services/roleService';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { teamService } from '../services/teamService';

interface Team {
  id: number;
  name: string;
  members: Staff[];
  created_at: string;
}

const REQUIRED_ROLES = ['Team Leader', 'Driver', 'Cash Officer', 'Police'];

const StaffList: React.FC = () => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newStaff, setNewStaff] = useState<CreateStaffData>({
    name: '',
    photo_url: '',
    empl_no: '',
    id_no: 0,
    role: ''
  });
  const contentRef = useRef<HTMLDivElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [selectedStaff, setSelectedStaff] = useState<Staff[]>([]);
  const [teamSize, setTeamSize] = useState(4); // Default team size
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);

  // Get current date in format: DD MMMM YYYY
  const currentDate = new Date().toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        console.log('Fetching staff and roles data...');
        
        const [staffData, rolesData] = await Promise.all([
          staffService.getStaffList(),
          roleService.getRoles()
        ]);
        
        console.log('Staff data:', staffData);
        console.log('Roles data:', rolesData);
        
        setStaff(staffData);
        setRoles(rolesData);
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        let errorMessage = 'Failed to load data. Please try again later.';
        
        if (err instanceof Error) {
          errorMessage = `Error: ${err.message}`;
        } else if (err.response) {
          errorMessage = `Server Error: ${err.response.data.message || 'Unknown error'}`;
        }
        
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewStaff(prev => ({
      ...prev,
      [name]: name === 'id_no' ? parseInt(value) || 0 : value
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
      setNewStaff({
        name: '',
        photo_url: '',
        empl_no: '',
        id_no: 0,
        role: ''
      });
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
    setEditingStaff(staff);
    setNewStaff({
      name: staff.name,
      photo_url: staff.photo_url,
      empl_no: staff.empl_no,
      id_no: staff.id_no,
      role: staff.role
    });
    setIsEditMode(true);
    setIsModalOpen(true);
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
      setTeamSize(4);
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
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading staff list...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="mt-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Staff List - {currentDate}
            </h3>
            <div className="flex space-x-4">
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                Add Staff
              </button>

              <a
                href="/dashboard/photo-list"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-gren-700"
              >
                Photo List
              </a>
              <button
                onClick={exportToPDF}
                disabled={isExporting}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                  isExporting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-red-900 hover:bg-red-700'
                }`}
              >
                {isExporting ? 'Exporting...' : 'Export to PDF'}
              </button>
              {/* <button
                onClick={() => setIsTeamModalOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700"
              >
                Create Teams
              </button> */}
            </div>
          </div>
          
          <div ref={contentRef} className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee Number
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID Number
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {staff.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{member.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{member.role}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{member.empl_no}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{member.id_no}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(member)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleStatus(member.id, member.status)}
                          className={`${
                            member.status === 1 
                              ? 'text-red-600 hover:text-red-900' 
                              : 'text-green-600 hover:text-green-900'
                          }`}
                        >
                          {member.status === 1 ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {isEditMode ? 'Edit Staff Member' : 'Add New Staff Member'}
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setIsEditMode(false);
                  setEditingStaff(null);
                  setNewStaff({
                    name: '',
                    photo_url: '',
                    empl_no: '',
                    id_no: 0,
                    role: ''
                  });
                  setSelectedFile(null);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  required
                  value={newStaff.name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="photo" className="block text-sm font-medium text-gray-700">
                  Photo
                </label>
                <input
                  type="file"
                  name="photo"
                  id="photo"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="mt-1 block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                />
                {selectedFile && (
                  <p className="mt-2 text-sm text-gray-500">
                    Selected file: {selectedFile.name}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="empl_no" className="block text-sm font-medium text-gray-700">
                  Employee Number
                </label>
                <input
                  type="text"
                  name="empl_no"
                  id="empl_no"
                  required
                  value={newStaff.empl_no}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="id_no" className="block text-sm font-medium text-gray-700">
                  ID Number
                </label>
                <input
                  type="number"
                  name="id_no"
                  id="id_no"
                  required
                  value={newStaff.id_no}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                  Role
                </label>
                <select
                  name="role"
                  id="role"
                  required
                  value={newStaff.role}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Select a role</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.name}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setIsEditMode(false);
                    setEditingStaff(null);
                    setNewStaff({
                      name: '',
                      photo_url: '',
                      empl_no: '',
                      id_no: 0,
                      role: ''
                    });
                    setSelectedFile(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 ${
                    isUploading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isUploading ? 'Saving...' : isEditMode ? 'Update Staff' : 'Add Staff'}
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
              <h3 className="text-lg font-medium text-gray-900">
                Create Teams
              </h3>
              <button
                onClick={() => {
                  setIsTeamModalOpen(false);
                  setTeamName('');
                  setTeamSize(4);
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
                <label htmlFor="teamName" className="block text-sm font-medium text-gray-700">
                  Team Name Prefix
                </label>
                <input
                  type="text"
                  id="teamName"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="e.g., Team"
                />
              </div>
              
              <div className="text-sm text-gray-500">
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
                    setTeamSize(4);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingTeam}
                  className={`px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 ${
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
    </div>
  );
};

export default StaffList;