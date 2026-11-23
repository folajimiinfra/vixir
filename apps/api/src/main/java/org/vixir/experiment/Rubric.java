package org.vixir.experiment;

import java.util.List;
import java.util.Map;
import jakarta.persistence.*;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "rubric")
public class Rubric {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "experiment_id", nullable = false)
    private String experimentId;

    @Column(nullable = false)
    private int version;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private List<Map<String, Object>> criteria;

    @Column(name = "max_total", nullable = false)
    private int maxTotal;

    public UUID getId() { return id; }
    public String getExperimentId() { return experimentId; }
    public void setExperimentId(String experimentId) { this.experimentId = experimentId; }
    public int getVersion() { return version; }
    public void setVersion(int version) { this.version = version; }
    public List<Map<String, Object>> getCriteria() { return criteria; }
    public void setCriteria(List<Map<String, Object>> criteria) { this.criteria = criteria; }
    public int getMaxTotal() { return maxTotal; }
    public void setMaxTotal(int maxTotal) { this.maxTotal = maxTotal; }
}
