import styles from "./Skeleton.module.css";

export default function Skeleton() {
  return (
    <div className={styles.skeleton} aria-hidden="true">
      <div>
        <div className={`${styles.linha} ${styles.linhaTitulo}`} />
        <div className={`${styles.linha} ${styles.linhaMeta}`} />
      </div>

      <div className={styles.bloco}>
        <div className={`${styles.linha} ${styles.linhaRotulo}`} />
        <div className={`${styles.linha} ${styles.linhaValorMedia}`} />
        <div className={`${styles.linha} ${styles.linhaMetaMedia}`} />
      </div>

      <div className={styles.grade}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className={styles.gradeItem}>
            <div className={`${styles.linha} ${styles.linhaRotulo}`} />
            <div className={`${styles.linha} ${styles.linhaValor}`} />
          </div>
        ))}
      </div>

      <div className={styles.timeline}>
        {[1, 2, 3].map((i) => (
          <div key={i} className={styles.movimento}>
            <div className={`${styles.linha} ${styles.linhaDataCurta}`} />
            <div className={`${styles.linha} ${styles.linhaTextoLongo}`} />
          </div>
        ))}
      </div>
    </div>
  );
}
