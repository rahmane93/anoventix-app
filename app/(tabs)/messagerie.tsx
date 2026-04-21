import { Redirect } from 'expo-router';

/**
 * Tab entry point for messagerie (professionals).
 * Redirects to the full messagerie stack.
 */
export default function MessagerieTab() {
  return <Redirect href="/messagerie" />;
}
