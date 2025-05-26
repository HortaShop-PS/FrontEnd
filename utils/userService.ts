interface UserProfile {
  id: string;
  name: string;
  email: string;
}

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export const fetchUserProfile = async (userId: string): Promise<UserProfile> => {
  
  try {
    
    console.log(`Attempting to fetch from: ${API_BASE_URL}/users/${userId}`);
    
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Server response: ${errorText}`);
      throw new Error(`Failed to fetch user profile: ${response.status}`);
    }
    
    const userData: UserProfile = await response.json();
    console.log('User data fetched successfully:', userData);
    return userData;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

export const getMockUserProfile = (): UserProfile => {
  return {
    id: '1',
    name: 'Fulano de Tal',
    email: 'fulano@fulanomail.com'
  };
};