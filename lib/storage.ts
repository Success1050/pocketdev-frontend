import Cookies from 'js-cookie';

const TOKEN_KEY = 'pocketdev_auth_token';
const USER_ID_KEY = 'pocketdev_user_id';
const SELECTED_PROJECT_KEY = 'pocketdev_selected_project';

export const saveAuthData = (token: string, userId: string) => {
  Cookies.set(TOKEN_KEY, token, { expires: 7 }); // 7 days expiration
  Cookies.set(USER_ID_KEY, userId, { expires: 7 });
};

export const getAuthToken = () => {
  return Cookies.get(TOKEN_KEY);
};

export const getUserId = () => {
  return Cookies.get(USER_ID_KEY);
};

export const clearAuthData = () => {
  Cookies.remove(TOKEN_KEY);
  Cookies.remove(USER_ID_KEY);
  Cookies.remove(SELECTED_PROJECT_KEY);
};

export const saveSelectedProject = (projectId: string, project: any) => {
  Cookies.set(SELECTED_PROJECT_KEY, JSON.stringify({ id: projectId, project }), { expires: 30 });
};

export const getSelectedProject = () => {
  const data = Cookies.get(SELECTED_PROJECT_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      return null;
    }
  }
  return null;
};
