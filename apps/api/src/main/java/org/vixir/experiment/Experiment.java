package org.vixir.experiment;

import jakarta.persistence.*;

@Entity
@Table(name = "experiment")
public class Experiment {

    @Id
    private String id;

    @Column(nullable = false)
    private String subject;

    @Column(nullable = false)
    private String title;

    @Column(name = "latest_published_version")
    private Integer latestPublishedVersion;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public Integer getLatestPublishedVersion() { return latestPublishedVersion; }
    public void setLatestPublishedVersion(Integer v) { this.latestPublishedVersion = v; }
}
