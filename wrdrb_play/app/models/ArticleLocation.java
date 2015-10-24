package models;

/**
 * @author Cecil Urena
 */
public enum ArticleLocation {
    CLOSET("closet"), DRESSER("dresser"), LAUNDRY("laundry"), OTHER("other");

    public String location;

    ArticleLocation(String location) {
        this.location = location;
    }
}
