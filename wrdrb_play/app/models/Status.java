package models;

/**
 * @author Cecil Urena
 */
public enum Status {
    READY("ready"), IN_HAMPER("inHamper"), NEEDS_IRONING("needsIroning");

    public String status;

    Status(String status) {
        this.status = status;
    }
}
