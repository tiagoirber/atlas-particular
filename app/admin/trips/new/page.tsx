import { TripFormWizard } from "@/components/trips/trip-form-wizard";
import styles from "../trips.module.css";

export default function NewTripPage() {
  return (
    <section className={styles.formContainer}>
      <header className={styles.formHeader}>
        <h1>Nova viagem</h1>
        <p>Vamos começar? Complete os 6 passos para registrar sua viagem.</p>
      </header>
      <TripFormWizard />
    </section>
  );
}
