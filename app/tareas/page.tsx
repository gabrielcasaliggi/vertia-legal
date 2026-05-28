import { TasksWorkspace } from "@/app/tareas/TasksWorkspace";
import { getCurrentProfile } from "@/lib/auth/session";

export default async function TasksPage() {
  const profile = await getCurrentProfile();

  return <TasksWorkspace profile={profile} />;
}
