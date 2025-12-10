import { Redirect } from 'expo-router';

export default function ChildProfileEdit() {
  // Redirect old route to new hidden settings route
  return <Redirect href="/(dashboard)/child/settings/profile-edit" />;
}
