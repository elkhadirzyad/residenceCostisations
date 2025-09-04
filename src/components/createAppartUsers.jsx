import { supabase } from "../supabaseClient";

async function createAppartUsers() {
  const residenceId = 1; // or whichever default residence
  const role = "proprietaire";

  for (let i = 2; i <= 24; i++) {
    const email = `appart${i}-kenza@gmail.com`;
    const password = `appart${i}`;
    const nom = `appart${i}`;
    const telephone = "1111111111";

    // Check if user already exists in utilisateurs
    const { data: exists } = await supabase
      .from("utilisateurs")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (exists) {
      console.log(`${email} already exists, skipping...`);
      continue;
    }

    // Create the account in auth.users
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: null },
    });

    if (signupError) {
      console.error(`Error creating ${email}:`, signupError.message);
      continue;
    }

    const user = signupData.user;

    if (user) {
      const { error: insertError } = await supabase.from("utilisateurs").insert([
        {
          id: user.id,
          residence_id: residenceId,
          nom,
          email,
          telephone,
          role,
          actif: true,
        },
      ]);

      if (insertError) {
        console.error(`Profile insert failed for ${email}:`, insertError.message);
      } else {
        console.log(`User created: ${email} / ${password}`);
      }
    }
  }
}

// Run the function

