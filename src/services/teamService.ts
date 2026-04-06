import api from './api';
import { Staff } from './staffService';

export interface Team {
  id: number;
  name: string;
  members: Staff[];
  created_at: string;
}

export interface CreateTeamData {
  name: string;
  members: number[];
}

export const teamService = {
  createTeam: async (teamData: CreateTeamData): Promise<Team> => {
    try {
      const response = await api.post('/teams', teamData);
      return response.data;
    } catch (error) {
      console.error('Error creating team:', error);
      throw error;
    }
  },

  getTeams: async (): Promise<Team[]> => {
    try {
      const response = await api.get('/teams');
      return response.data;
    } catch (error) {
      console.error('Error fetching teams:', error);
      throw error;
    }
  }
}; 