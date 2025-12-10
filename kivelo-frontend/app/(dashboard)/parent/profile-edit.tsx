import { Redirect } from 'expo-router';

export default function ParentProfileEdit() {
  // Redirect to new settings subroute
  return <Redirect href="/(dashboard)/parent/settings/profile-edit" />;
}
