package models;

/**
 * @author Cecil Urena
 */
public enum Occasion {
    FORMAL("formal"), CASUAL("casual"), BUSINESS_CASUAL("businessCasual"), SPORT("sport"), WORK("work");

    public String occasion;

    Occasion(String occasion) {
        this.occasion = occasion;
    }
}
