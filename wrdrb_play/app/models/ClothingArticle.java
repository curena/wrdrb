package models;

import java.io.File;
import java.util.Date;

/**
 * @author Cecil Urena
 */
public class ClothingArticle {
    private ArticleType type;
    private String name;
    private Status status;
    private boolean isAvailable;
    private File picture;
    private Date lastWorn;
    private ArticleLocation location;


}
