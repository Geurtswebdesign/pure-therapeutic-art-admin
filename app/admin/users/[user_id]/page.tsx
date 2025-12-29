import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase-admin';
import { getAdminUser } from '@/lib/auth/getAdminUser';

import { AdminUser, CreditWallet, CreditTransaction } from './types';
import UserHeader from './UserHeader';
import CreditOverview from './CreditOverview';
import CreditTransactions from './CreditTransactions';

type PageProps = {
  params: Promise<{
    user_id: string;
  }>;
};

export default async function AdminUserDetailPage({ params }: PageProps) {
  const { user_id } = await params;

  /* =========================
     1. Admin authorisatie
     ========================= */
  const adminUser = await getAdminUser();

  if (!adminUser) {
    redirect('/unauthorized');
  }

  const supabase = createAdminClient();

  /* =========================
     2. Profile ophalen of aanmaken (LAZY)
     ========================= */
  let user: AdminUser;

  const { data: existingUser } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user_id)
    .single<AdminUser>();

  if (!existingUser) {
    const { data: newUser, error } = await supabase
      .from('profiles')
      .insert({
        id: user_id,
        email: adminUser.email,
        full_name: adminUser.email?.split('@')[0] ?? null,
      })
      .select()
      .single<AdminUser>();

    if (error || !newUser) {
      throw new Error('Kon user-profiel niet aanmaken');
    }

    user = newUser;
  } else {
    user = existingUser;
  }

  /* =========================
     3. Credit wallet ophalen of aanmaken (LAZY)
     ========================= */
  let wallet: CreditWallet;

  const { data: existingWallet } = await supabase
    .from('credit_wallets')
    .select('*')
    .eq('user_id', user_id)
    .single<CreditWallet>();

  if (!existingWallet) {
    const { data: newWallet, error } = await supabase
      .from('credit_wallets')
      .insert({
        user_id,
        credits_available: 0,
      })
      .select()
      .single<CreditWallet>();

    if (error || !newWallet) {
      throw new Error('Kon credit wallet niet aanmaken');
    }

    wallet = newWallet;
  } else {
    wallet = existingWallet;
  }

  /* =========================
     4. Credit transacties ophalen
     ========================= */
  const { data: transactions } = await supabase
    .from('credit_transactions')
    .select('*')
    .eq('user_id', user_id)
    .order('created_at', { ascending: false })
    .limit(50)
    .returns<CreditTransaction[]>();

  /* =========================
     5. Render pagina
     ========================= */
  return (
    <div className="space-y-8">
      <UserHeader user={user} />

      <CreditOverview
        wallet={wallet}
        userId={user.id}
      />

      <CreditTransactions
        transactions={transactions ?? []}
      />
    </div>
  );
}
