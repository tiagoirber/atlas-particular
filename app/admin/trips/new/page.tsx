import { TripForm } from "@/components/trips/trip-form";
import styles from "../trips.module.css";

export default function NewTripPage() {
  return (
    <section className={styles.formContainer}>
      <header className={styles.formHeader}>
        <h1>Nova viagem</h1>
        <p>Preencha os dados gerais. Você pode adicionar dias, atrações e fotos depois.</p>
      </header>
      <TripForm />
    </section>
  );
}
