import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/app/lib/firebase'
import { User } from '@/types/panel'
import { ExtendedChild } from '@/hooks/useProfileForm'

export async function fetchUserProfile(userId: string): Promise<User | null> {
  const docRef = doc(db, 'users', userId)
  const snap = await getDoc(docRef)
  if (!snap.exists()) {
    return null
  }
  const data = snap.data() as User
  return { ...data, id: userId }
}

export async function updateUserProfile(userId: string, data: Partial<User> & { children?: ExtendedChild[] }): Promise<void> {
  const docRef = doc(db, 'users', userId)
  await updateDoc(docRef, data)
}
