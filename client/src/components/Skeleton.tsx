import styles from "./Skeleton.module.css";

export default function Skeleton() {
  return (
    <div className={styles.skeleton} aria-hidden="true">
      <div className={`${styles.linha} ${styles.linhaTitulo}`} />
      <div className={styles.linha} />
      <div className={styles.linha} />
      <div className={styles.linha} />
      <div className={styles.linha} />
    </div>
  );
}